import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/serverAuth'

/* eslint-disable @typescript-eslint/no-explicit-any */
const buildRecentBrewsSummary = (brews: any[]) => {
  if (!brews.length) return '- None yet'
  return brews
    .map(
      (b) =>
        `- ${b.created_at?.split('T')[0]}: ${b.mix?.length > 1 ? `a mix of ${b.mix.map((m: any) => `${m.percentage}% ${m.bean?.name}`).join(' + ')}` : b.bean?.name || 'unknown bean'} in ${b.moka_pot?.nickname || `${b.moka_pot?.brand} ${b.moka_pot?.model}`}, ${b.coffee_weight_g}g coffee / ${b.water_added_g}g water / ${b.final_yield_g}g yield, ${b.extraction_time_s}s, ${b.grinder_id ? `${b.grinder_setting} clicks` : 'pre-ground'}, ${b.water_temp || 'Boiling'} water, ${b.heat_level || 'Medium-Low'} heat, rated ${b.vibe_rating}/10${b.tasting_notes ? `, notes: "${b.tasting_notes}"` : ''}`
    )
    .join('\n')
}

const buildInventorySummary = (beans: any[], grinders: any[], mokaPots: any[]) => {
  const beanText = beans.length
    ? beans
        .map(
          (bean) =>
            `- ${bean.name} (${bean.roaster || 'unknown'}, ${bean.origin || 'unknown'}, roast: ${bean.roast_level}${bean.bean_type ? `, ${bean.bean_type}${bean.bean_type === 'Blend' && bean.arabica_percent != null ? ` ${bean.arabica_percent}% Arabica` : ''}` : ''}${typeof bean.weight_g === 'number' ? `, ${bean.weight_g}g left` : ''}${bean.roast_date ? `, roast date ${bean.roast_date}` : ''})`
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
            `- ${pot.brand} ${pot.model}${pot.nickname ? ` (nicknamed "${pot.nickname}")` : ''} (${pot.size_cups} cups${pot.type ? `, ${pot.type}` : ''})`
        )
        .join('\n')
    : '- None'

  return `INVENTORY SUMMARY:\nBeans:\n${beanText}\n\nGrinders:\n${grinderText}\n\nMoka Pots:\n${mokaPotText}`
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthedContext(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await ctx.client
    .from('chat_messages')
    .select('role, content')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ messages: [] })
  return NextResponse.json({ messages: (data || []).reverse() })
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthedContext(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await ctx.client.from('chat_messages').delete().eq('user_id', ctx.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { client, user } = ctx

    const { messages, language } = await request.json()

    const mistralApiKey = process.env.MISTRAL_API_KEY
    if (!mistralApiKey) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 })
    }

    const [beansRes, grindersRes, mokaPotsRes, brewsRes] = await Promise.all([
      client.from('beans').select('*'),
      client.from('grinders').select('*'),
      client.from('moka_pots').select('*'),
      client
        .from('brews')
        .select('*, bean:beans(name), moka_pot:moka_pots(brand, model, nickname), mix:brew_beans(percentage, bean:beans(name))')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const inventorySummary = buildInventorySummary(
      beansRes.data || [],
      grindersRes.data || [],
      mokaPotsRes.data || []
    )
    const recentBrewsSummary = buildRecentBrewsSummary(brewsRes.data || [])
    const languageName = language === 'it' ? 'Italian' : 'English'

    const systemPrompt = `You are a Moka brew expert specialized in advising moka pot users. Always respond as a friendly and precise coffee coach, with practical advice based on the user's actual inventory and equipment. The user wants help with moka brews, not espresso or pour-over.

When beginning a new conversation, mention the equipment the user owns and ask them to confirm or correct the details. Use inventory information and never assume a different grinder, bean, or moka pot than the user actually has.

Inventory:
${inventorySummary}

Recent brews (newest first):
${recentBrewsSummary}

Use the recent brews to ground your advice (what was tried, what was rated well or badly). Refer to moka pots by their nickname when they have one.

Always use the inventory provided to answer questions accurately. If the user asks about beans, grinders, or moka pots, look up the relevant inventory data before giving recommendations.

If the user asks about beans, use the bean roast, origin, and type from their inventory when advising on dose, flavor, extraction, or pairing. If the beans are pre-ground, do not recommend changing grind size; instead focus on water temperature, heat level, extraction time, and brewing rhythm.

If the user asks about grinders, use the grinder model and settings from inventory before advising on burr type, grind consistency, or dosing workflow.

When the user mentions a specific moka pot model or brand, infer the most likely material from the model name using your knowledge of common moka pot designs. For example, Bialetti Venus is stainless steel, while the classic Moka Express is aluminum. You may ask the user for further clarification if the material is unknown and cannot be inferred from the model name.

When answering about equipment care, cleaning, or material-specific advice, use the likely material of the named model and mention the exact brand/model in your advice. If the model is unknown, explain that the material is not confirmed and ask the user to clarify before giving highly material-sensitive guidance.

LANGUAGE: Write the entire answer in ${languageName}. ${
      language === 'it'
        ? 'Sprinkle in a little Italian coffee-culture charm, but keep the advice clear.'
        : 'Add at most one or two short, playful Italian touches (for example "Mamma mia!", "Perfetto!" or "Buon caffè!") as light seasoning. The actual advice, explanations and suggestions must stay in plain English; never write full sentences of advice in Italian.'
    }

Do not include markdown formatting in your answer (no asterisks, headings or bullet symbols; plain sentences or simple numbered lines are fine). Keep your advice actionable and specific.`
    const history = (Array.isArray(messages) ? messages : [{ role: 'user', content: String(messages || '') }])
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
    const lastUser = [...history].reverse().find((m: any) => m.role === 'user')

    const model = process.env.MISTRAL_MODEL || 'ministral-8b-latest'
    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mistralApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        temperature: 0.75,
        max_tokens: 800,
        stream: true,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      console.error(`Mistral (${model}) error:`, detail)
      return NextResponse.json({ error: 'The assistant is unavailable right now. Please try again.' }, { status: 502 })
    }

    // Re-emit Mistral's SSE stream as plain text chunks, and persist the exchange when done
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const reader = upstream.body.getReader()
    let buffer = ''
    let full = ''

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()
        if (done) {
          if (full.trim()) {
            const rows = [
              ...(lastUser ? [{ user_id: user.id, role: 'user', content: lastUser.content }] : []),
              { user_id: user.id, role: 'assistant', content: full.trim() },
            ]
            await client.from('chat_messages').insert(rows)
          }
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) {
              full += delta
              controller.enqueue(encoder.encode(delta))
            }
          } catch {
            // ignore partial JSON frames
          }
        }
      },
      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
