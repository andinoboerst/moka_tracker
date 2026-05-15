import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { makeJournalKeys } from '@/lib/beanJournal'

function userClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, roaster, language = 'en' } = await request.json()
    if (!name || !roaster) return NextResponse.json({ error: 'Missing name or roaster' }, { status: 400 })

    const client = userClient(token!)

    const { data: matchedBeans } = await client
      .from('beans')
      .select('id')
      .ilike('name', name.trim())
      .ilike('roaster', roaster.trim())

    if (!matchedBeans || matchedBeans.length === 0) {
      return NextResponse.json({ error: 'No beans found' }, { status: 404 })
    }

    const beanIds = matchedBeans.map(b => b.id)

    const { data: brews, error: brewsError } = await client
      .from('brews')
      .select('*, bean:beans(*), grinder:grinders(*), moka_pot:moka_pots(*)')
      .in('bean_id', beanIds)
      .order('created_at', { ascending: false })

    if (brewsError) return NextResponse.json({ error: brewsError.message }, { status: 500 })

    if (!brews || brews.length === 0) {
      return NextResponse.json({ error: 'No brews found for this bean' }, { status: 404 })
    }

    const bestBrew = [...brews].sort((a, b) => {
      if ((b.vibe_rating || 0) !== (a.vibe_rating || 0)) {
        return (b.vibe_rating || 0) - (a.vibe_rating || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })[0]

    const allNotes = brews.slice(0, 8).map(b => b.tasting_notes).filter(Boolean).join('; ')
    const avgRating = brews.reduce((sum, b) => sum + (b.vibe_rating || 0), 0) / brews.length
    const roastLevel = brews[0]?.bean?.roast_level || 'Unknown'

    let prompt = `You are a warm, passionate Italian brew master giving someone a personal summary of their own tasting notes and opinions about a bean named "${name}" from "${roaster}" (Roast Level: ${roastLevel}).
This person brewed it ${brews.length} time(s), with an average rating of ${avgRating.toFixed(1)}/10.
Their tasting notes across those brews: "${allNotes || 'No specific notes'}".

Speak directly to the person — as if you are narrating their experience back to them with warmth and Italian flair. Address it as THEIR cup, THEIR experience.
Use phrases like "Your cup sang with...", "When you nailed it, the result was...", "There were moments when bitterness crept into your brew...", etc.
Do NOT use first-person ("I tasted", "My experience"). Do NOT say "the user" or "users found".
Mix in occasional Italian flair words naturally, BUT ensure they match the rating sentiment! Use "Magnifico!", "Ottimo!", or "Buonissimo!" ONLY if the average rating is high (8+). Use "Mamma mia...", "Che disastro", or "Peccato" if the rating is low. You should use plenty of expressive emojis!
Focus on tasting notes, overall impression, and whether the experience was generally positive, mixed, or disappointing.
Keep it warm, vivid, and under 3 sentences, and less than 80 words! Absolutely no bullet points, no asterisks, no markdown — plain flowing text only.
Include a short final verdict on wether they should rebuy, avoid or neutral on the bean and based on what conditions. For example you could recommend a certain bean if the user was looking for fruity notes, etc.
Do NOT give any recommendations on brew settings, just on wether to rebuy or not.
RESPOND STRICTLY IN ${language === 'it' ? 'ITALIAN' : 'ENGLISH'}. Even if the user's tasting notes are in English, translate your summary into the specified language.`

    let summaryText = ''
    try {
      const mistralApiKey = process.env.MISTRAL_API_KEY
      if (mistralApiKey) {
        const recapResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        })

        if (recapResponse.ok) {
          const mistralData = await recapResponse.json()
          let raw = mistralData.choices?.[0]?.message?.content?.trim() || ''
          // Strip markdown formatting that would render as literal symbols
          raw = raw.replace(/\*\*([^*]+)\*\*/g, '$1') // bold
          raw = raw.replace(/\*([^*]+)\*/g, '$1')     // italic
          raw = raw.replace(/^#+\s+/gm, '')            // headings
          raw = raw.replace(/^[-*]\s+/gm, '')          // list bullets
          raw = raw.replace(/`([^`]+)`/g, '$1')        // inline code
          summaryText = raw
        } else {
          console.error('Mistral API error:', await recapResponse.text())
        }
      }
    } catch (e) {
      console.error(e)
    }

    if (!summaryText) {
      summaryText = `An AI summary could not be generated at this time.`
    }

    const keys = makeJournalKeys(name, roaster)
    const { data: existing } = await client
      .from('bean_journal')
      .select('id')
      .eq('user_id', user.id)
      .eq('name_key', keys.name_key)
      .eq('roaster_key', keys.roaster_key)
      .maybeSingle()

    if (existing?.id) {
      await client.from('bean_journal').update({ flavor_notes: summaryText, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await client.from('bean_journal').insert([{
        user_id: user.id,
        name: name.trim(),
        roaster: roaster.trim(),
        ...keys,
        flavor_notes: summaryText,
        updated_at: new Date().toISOString()
      }])
    }

    return NextResponse.json({ summary: summaryText })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
