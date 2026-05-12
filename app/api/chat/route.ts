import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const buildInventorySummary = (beans: any[], grinders: any[], mokaPots: any[]) => {
  const beanText = beans.length
    ? beans
        .map(
          (bean) =>
            `- ${bean.name} (${bean.roaster || 'unknown'}, ${bean.origin || 'unknown'}, roast: ${bean.roast_level}${bean.roast_date ? `, roast date ${bean.roast_date}` : ''})`
        )
        .join('\n')
    : '- None'

  const grinderText = grinders.length
    ? grinders
        .map(
          (grinder) =>
            `- ${grinder.brand} ${grinder.model}${grinder.microns_per_click ? ` (~${grinder.microns_per_click} µm/click)` : ''}`
        )
        .join('\n')
    : '- None'

  const mokaPotText = mokaPots.length
    ? mokaPots
        .map(
          (pot) =>
            `- ${pot.brand} ${pot.model} (${pot.size_cups} cups${pot.type ? `, ${pot.type}` : ''})`
        )
        .join('\n')
    : '- None'

  return `INVENTORY SUMMARY:\nBeans:\n${beanText}\n\nGrinders:\n${grinderText}\n\nMoka Pots:\n${mokaPotText}`
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { messages, language } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const [beansRes, grindersRes, mokaPotsRes] = await Promise.all([
      userClient.from('beans').select('*'),
      userClient.from('grinders').select('*'),
      userClient.from('moka_pots').select('*'),
    ])

    const beans = beansRes.data || []
    const grinders = grindersRes.data || []
    const mokaPots = mokaPotsRes.data || []

    const inventorySummary = buildInventorySummary(beans, grinders, mokaPots)
    const languageMode = language === 'it' ? 'ITALIAN' : 'ENGLISH'

    const systemPrompt = `You are a Moka brew expert specialized in advising moka pot users. Always respond as a friendly and precise coffee coach, with practical advice based on the user's actual inventory and equipment. The user wants help with moka brews, not espresso or pour-over.

When beginning a new conversation, mention the equipment the user owns and ask them to confirm or correct the details. Use inventory information and never assume a different grinder, bean, or moka pot than the user actually has.

Inventory:
${inventorySummary}

Always use the inventory provided to answer questions accurately. If the user asks about beans, grinders, or moka pots, look up the relevant inventory data before giving recommendations.

If the user asks about beans, use the bean roast, origin, and type from their inventory when advising on dose, flavor, extraction, or pairing. If the beans are pre-ground, do not recommend changing grind size; instead focus on water temperature, heat level, extraction time, and brewing rhythm.

If the user asks about grinders, use the grinder model and settings from inventory before advising on burr type, grind consistency, or dosing workflow.

When the user mentions a specific moka pot model or brand, infer the most likely material from the model name using your knowledge of common moka pot designs. For example, Bialetti Venus is stainless steel, while the classic Moka Express is aluminum. You may ask the user for further clarification if the material is unknown and cannot be inferred from the model name.

When answering about equipment care, cleaning, or material-specific advice, use the likely material of the named model and mention the exact brand/model in your advice. If the model is unknown, explain that the material is not confirmed and ask the user to clarify before giving highly material-sensitive guidance.

Always use Italian coffee terms and flair, even if the response is in English. Respond in ${languageMode}. Do not include markdown formatting in your answer. Keep your advice actionable and specific.`

    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(messages) ? messages : [{ role: 'user', content: String(messages || '') }]),
    ]

    const mistralApiKey = process.env.MISTRAL_API_KEY
    if (!mistralApiKey) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 })
    }

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: requestMessages,
        temperature: 0.75,
      }),
    })

    if (!mistralResponse.ok) {
      const text = await mistralResponse.text()
      return NextResponse.json({ error: `Mistral error: ${text}` }, { status: 500 })
    }

    const data = await mistralResponse.json()
    const answer = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
