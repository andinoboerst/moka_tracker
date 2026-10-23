import type { SupabaseClient } from '@supabase/supabase-js'
import { mixArabicaShare } from './beans'

export interface RecapInput {
  bean_id: string
  grinder_id?: string | null
  moka_pot_id: string
  grinder_setting?: number | null
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  milk_added_g?: number | null
  milk_type?: string | null
  vibe_rating: number
  tasting_notes?: string | null
  water_temp?: string | null
  heat_level?: string | null
  has_paper_filter?: boolean
  flow_type?: string | null
  brew_ratio_input: number
  extraction_ratio_output: number
  mix?: { bean_id: string; percentage: number }[] | null
  language?: string
}

/**
 * Builds the AI "brew master" recap (JSON string with summary + suggestion) for a brew.
 * Falls back to a canned recap when the model is unavailable.
 */
export async function generateBrewRecap(
  userClient: SupabaseClient,
  input: RecapInput,
  excludeBrewId?: string
): Promise<string> {
  const {
    bean_id, grinder_id, moka_pot_id, grinder_setting, coffee_weight_g, water_added_g,
    final_yield_g, extraction_time_s, milk_added_g, milk_type, vibe_rating, tasting_notes,
    water_temp, heat_level, has_paper_filter, flow_type, brew_ratio_input,
    extraction_ratio_output, language = 'en', mix,
  } = input

  // Fetch entity details for richer AI context
  const [beanRes, grinderRes, mokaPotRes] = await Promise.all([
    userClient.from('beans').select('*').eq('id', bean_id).single(),
    grinder_id ? userClient.from('grinders').select('*').eq('id', grinder_id).single() : Promise.resolve({ data: null }),
    userClient.from('moka_pots').select('*').eq('id', moka_pot_id).single()
  ])

  const bean = beanRes.data

  // Optional mix of several beans
  let mixText = ''
  if (mix && mix.length > 1) {
    const { data: mixBeans } = await userClient.from('beans').select('*').in('id', mix.map((c) => c.bean_id))
    const components = [...mix]
      .sort((a, b) => b.percentage - a.percentage)
      .map((c) => ({ percentage: c.percentage, bean: (mixBeans || []).find((b: { id: string }) => b.id === c.bean_id) }))
    const share = mixArabicaShare(components)
    mixText = `- BEAN MIX (manually blended by the user): ${components
      .map((c) => `${c.percentage}% ${c.bean?.name ?? 'unknown'}${c.bean?.bean_type ? ` (${c.bean.bean_type})` : ''}${c.bean?.roast_level ? `, ${c.bean.roast_level} roast` : ''}`)
      .join(' + ')}${share !== null ? ` => overall about ${share}% Arabica / ${100 - share}% Robusta` : ''}`
  }
  const grinder = grinderRes.data
  const mokaPot = mokaPotRes.data

  const totalMicrons = (grinder?.microns_per_click && grinder_setting)
    ? grinder.microns_per_click * grinder_setting
    : null

  let daysPastRoast = null
  if (bean?.roast_date) {
    const brewDate = new Date()
    const roastDate = new Date(bean.roast_date)
    daysPastRoast = Math.max(0, Math.floor((brewDate.getTime() - roastDate.getTime()) / (1000 * 60 * 60 * 24)))
  }


  // Fetch up to 3 previous brews with exactly the same setup
  let query = userClient
    .from('brews')
    .select('*')
    .eq('bean_id', bean_id)
    .eq('moka_pot_id', moka_pot_id)
  if (excludeBrewId) query = query.neq('id', excludeBrewId)

  if (grinder_id) {
    query = query.eq('grinder_id', grinder_id)
  } else {
    query = query.is('grinder_id', null)
  }

  const { data: previousBrews } = await query
    .order('created_at', { ascending: false })
    .limit(3)

  let historyText = 'No previous brews with this exact setup.'
  if (previousBrews && previousBrews.length > 0) {
    historyText = previousBrews.map((b, i) => `
Previous Brew ${i + 1}:
- Vibe Rating: ${b.vibe_rating}/10
${b.grinder_id ? `- Grinder Setting: ${b.grinder_setting} clicks` : '- Coffee was Pre-ground'}
- Coffee/Water/Yield: ${b.coffee_weight_g}g / ${b.water_added_g}g / ${b.final_yield_g}g
- Extraction Time: ${b.extraction_time_s}s
- Expert Vars: ${b.water_temp || 'Boiling'} Start, ${b.heat_level || 'Med'} Heat, ${b.flow_type || 'Steady'} Flow, Filter: ${b.has_paper_filter ? 'Yes' : 'No'}
- Tasting Notes: "${b.tasting_notes || 'None'}"`).join('\n')
  }

  // Generate AI recap via Mistral directly
  let ai_recap = ''
  try {
    const mistralApiKey = process.env.MISTRAL_API_KEY

    if (mistralApiKey) {
      const prompt = `You are a coffee brewing expert with a warm, expressive Italian personality.
${language === 'it'
? 'Write everything in Italian.'
: 'Write everything in clear, natural English. Your Italian side only shows as a few short exclamations dropped in for fun (at most two per field, e.g. "Magnifico!", "Perfetto!", "Mamma mia!", "Che peccato!", "Sacrilegio!"). Never write whole sentences in Italian, and the actual analysis and instructions must always be in English.'}
If a brew is good, you are ecstatic. If a brew is bad, you are dramatic and heartbroken, but you always stay helpful.

Analyze the following CURRENT brew details, and consider the HISTORY of previous brews with this exact same setup, to provide a JSON response with two specific keys:

1. "summary": A short 1-2 sentence recap explaining WHY the CURRENT brew came out the way it did based on the extraction ratios and tasting notes. Do NOT use emojis; let dry, deadpan wit carry the personality.
2. "suggestion": Start by briefly acknowledging the current result in a few words, then give a detailed 2-3 sentence suggestion for the next brew. Give clear, exact instructions on what to change and why it will improve the coffee. Do NOT use emojis; let dry, deadpan wit carry the personality.

CONTEXT:
- This is for a MOKA POT brew. This is not espresso or pour-over.
- Suggestions about water should refer to "Starting Water Temp" (the water you put in the boiler).
- Do not be too exact with temperature degrees (e.g., don't say "use exactly 82°C"), use general terms like "warmer", "cooler", "near boiling", etc.

CURRENT Brew Details:
${mixText || `- Bean: ${bean?.name} (${bean?.roaster}) - Species: ${bean?.bean_type || 'Unknown'}${bean?.bean_type === 'Blend' && bean?.arabica_percent != null ? ` (${bean.arabica_percent}% Arabica)` : ''} - Origin: ${bean?.origin || 'Unknown'} - Roast Level: ${bean?.roast_level}`}${mixText ? '\n- Main bean details: ' + bean?.name + ' (' + bean?.roaster + ') - Origin: ' + (bean?.origin || 'Unknown') + ' - Roast Level: ' + bean?.roast_level : ''} ${bean?.roast_date ? `(Roast Date: ${bean.roast_date}, Freshness: ${daysPastRoast} days)` : ''}
- Moka Pot: ${mokaPot?.brand} ${mokaPot?.model} (${mokaPot?.size_cups} Cup, ${mokaPot?.type})
${grinder
          ? `- Grinder: ${grinder.brand} ${grinder.model}
- Grinder Setting: ${grinder_setting} clicks ${totalMicrons ? `(~${totalMicrons} microns)` : ''}`
          : '- Coffee: Pre-ground (No grinder used)'}
- Vibe Rating: ${vibe_rating}/10
- Tasting Notes: "${tasting_notes || 'None provided'}"
- Coffee: ${coffee_weight_g}g
- Water In: ${water_added_g}g
- Yield: ${final_yield_g}g
- Extraction Time: ${extraction_time_s} seconds
- Milk Added: ${milk_added_g ? `${milk_added_g}g (${milk_type || 'Unknown type'})` : 'None (Black Coffee)'}
- Brew Ratio: 1:${brew_ratio_input}
- Extraction Ratio: 1:${extraction_ratio_output}
- Starting Water Temp: ${water_temp || 'Boiling'}
- Heat Level: ${heat_level || 'Medium-Low'}
- Using Paper Filter: ${has_paper_filter ? 'Yes' : 'No'}
- Flow Observation: ${flow_type || 'Steady'}

HISTORY (Last 3 brews with this setup):
${historyText}

Rules:
- If rating is low (≤5) and notes mention "bitter", suggest coarser grind, lower heat, or starting with cooler water.
- If notes mention "sour", suggest finer grind, higher heat, or starting with hotter water.
- If flow_type is "Sputtering", emphasize heat management and the "stop point".
- IF THE COFFEE IS PRE-GROUND, DO NOT suggest changing the grind size. Focus on heat and starting water temp instead!
- SPECIES AWARENESS: Robusta gives more body, crema and bitterness and has roughly twice the caffeine, while Arabica adds sweetness, acidity and aroma. For Robusta-heavy beans or mixes, bitterness is the usual risk (suggest cooler starting water, lower heat, or a coarser grind); if a mix is used, you may suggest adjusting the mix ratio (for example a bit more Arabica for sweetness or more Robusta for body and crema).
- ROAST AWARENESS: For DARK roasts, generally suggest starting with cooler water to avoid bitterness. For LIGHT roasts, suggest warmer water to ensure full extraction.
- WATER TEMP: Always refer to it as "Starting Water Temp" and use general terms (warmer, cooler, near boiling) instead of exact degrees.
- YOU MUST RETURN A VALID JSON OBJECT WITH EXACTLY TWO KEYS: "summary" and "suggestion".
- Do not use markdown blocks around the JSON. Just return raw JSON.
- Absolutely no bullet points, no asterisks, no markdown — plain flowing text only.
- ${language === 'it' ? 'RESPOND IN ITALIAN.' : 'RESPOND IN ENGLISH (plus the few short Italian exclamations described above). Even if the tasting notes are in another language, answer in English.'}

Example Response:
${language === 'it'
? '{"summary":"Mamma mia, il rapporto di estrazione di 1:1.7 era troppo basso, il caffè è acido e debole!","suggestion":"Peccato! La prossima volta macina più fine per rallentare l\'acqua e far uscire la dolcezza."}'
: '{"summary":"Mamma mia, the extraction ratio of 1:1.7 was far too low, leaving the cup sour and weak!","suggestion":"Peccato, a bit under-extracted. Next time grind one or two clicks finer to slow the water down and pull out more sweetness. Perfetto will follow!"}'}`

      const primaryModel = process.env.MISTRAL_MODEL || 'ministral-8b-latest'
      const candidateModels = [primaryModel, 'open-mistral-7b'].filter((m, i, arr) => arr.indexOf(m) === i)

      for (const model of candidateModels) {
        try {
          const recapResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mistralApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 600,
              response_format: { type: 'json_object' }
            }),
          })

          if (recapResponse.ok) {
            const mistralData = await recapResponse.json()
            let content = mistralData.choices?.[0]?.message?.content?.trim() || ''

            // Strip markdown code blocks if Mistral returned them
            if (content.startsWith('```json')) {
              content = content.replace(/^```json\n/, '').replace(/\n```$/, '')
            } else if (content.startsWith('```')) {
              content = content.replace(/^```\n/, '').replace(/\n```$/, '')
            }

            try {
              // Verify it's valid JSON before saving
              const parsed = JSON.parse(content)
              if (typeof parsed.summary === 'object' || typeof parsed.suggestion === 'object') {
                ai_recap = JSON.stringify({
                  summary: typeof parsed.summary === 'string' ? parsed.summary : JSON.stringify(parsed.summary),
                  suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : JSON.stringify(parsed.suggestion),
                })
              } else {
                ai_recap = content
              }
              break
            } catch (parseError) {
              console.error(`Mistral (${model}) returned invalid JSON:`, content)
            }
          } else {
            console.error(`Mistral (${model}) API error:`, await recapResponse.text())
          }
        } catch (reqErr) {
          console.error(`Mistral request error with model ${model}:`, reqErr)
        }
      }
    }

    // Fallback generator if Mistral fails or no key
    if (!ai_recap) {
      let summary = ''
      let suggestion = ''

      if (vibe_rating <= 3) {
        summary = `Mamma Mia! Che disastro! Your extraction ratio of 1:${extraction_ratio_output} was all over the place, like a Vespa in a crowded piazza!`
        if ((tasting_notes || '').toLowerCase().includes('bitter')) {
          summary = `Sacrilegio! This brew is as bitter as a broken heart due to over-extraction at 1:${extraction_ratio_output}. My soul is weeping!`
          suggestion = `For the next time, coarser grind and lower heat, per favore! Give the coffee some respect and it will love you back. It must be as smooth as a gondola ride!`
        } else if ((tasting_notes || '').toLowerCase().includes('sour')) {
          summary = `Che peccato! The sourness tells me you rushed the extraction. A 1:${brew_ratio_input} ratio is not enough love for these beans!`
          suggestion = `Ottimo! Use a finer grind next time to let the water dance with the coffee longer. Slow it down, let the flavors bloom like a spring day in Tuscany!`
        } else {
          suggestion = `Che disastro! Experiment with your grinder and give it some Italian passion next time. Don't be afraid to try something new, fortune favors the bold!`
        }
      } else if (vibe_rating <= 6) {
        summary = `Bene! A solid effort. Your 1:${brew_ratio_input} brew ratio gave us a yield of 1:${extraction_ratio_output}. Not bad, but we can do better!`
        suggestion = `A small tweak to the clicks, and it will be Buonissimo! Just a little more precision with your grind and you will be singing like Pavarotti!`
      } else {
        summary = `Magnifico! Splendido! This brew is a work of art, a true Italian masterpiece. I am moved to tears!`
        suggestion = `Perfetto! Keep these settings exactly as they are. You have found the soul of the moka pot, now go and enjoy this liquid gold!`
      }
      ai_recap = JSON.stringify({ summary, suggestion })
    }
  } catch (error) {
    console.error('Error generating AI recap:', error)
    // We will save with empty string or continue without crashing
  }
  return ai_recap
}
