import type { SupabaseClient } from '@supabase/supabase-js'
import { mixArabicaShare } from './beans'
import { describeProfile, type PressureStage } from './pressure'
import { mistralComplete, stripMarkdown } from './mistral'

export interface RecapInput {
  bean_id: string
  grinder_id?: string | null
  moka_pot_id: string
  portafilter?: string | null
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
  brew_temp_c?: number | null
  pressure_profile?: PressureStage[] | null
  first_drip_s?: number | null
  taste_balance?: string | null
  used_wdt?: boolean | null
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
    bean_id, grinder_id, moka_pot_id, portafilter, grinder_setting, coffee_weight_g, water_added_g,
    final_yield_g, extraction_time_s, milk_added_g, milk_type, vibe_rating, tasting_notes,
    water_temp, heat_level, has_paper_filter, flow_type, brew_ratio_input,
    extraction_ratio_output, language = 'en', mix, brew_temp_c, pressure_profile, first_drip_s, taste_balance, used_wdt,
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

  const espresso = mokaPot?.kind === 'espresso'
  const stepless = grinder?.adjustment_type === 'stepless'
  const totalMicrons = (!stepless && grinder?.microns_per_click && grinder_setting)
    ? grinder.microns_per_click * grinder_setting
    : null
  const grindSettingText = stepless
    ? `${grinder_setting} microns (stepless grinder, setting is the grind size)`
    : `${grinder_setting} clicks ${totalMicrons ? `(~${totalMicrons} microns)` : ''}`
  const profileText = pressure_profile && pressure_profile.length ? describeProfile(pressure_profile) : 'not recorded'

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
${b.grinder_id ? `- Grinder Setting: ${b.grinder_setting}${stepless ? ' microns (stepless)' : ' clicks'}` : '- Coffee was Pre-ground'}
- Coffee/Water/Yield: ${b.coffee_weight_g}g / ${b.water_added_g}g / ${b.final_yield_g}g
- Extraction Time: ${b.extraction_time_s}s
${espresso
  ? `- Espresso Vars: ${b.brew_temp_c != null ? b.brew_temp_c + '°C' : 'temp not recorded'}, pressure profile: ${b.pressure_profile?.length ? describeProfile(b.pressure_profile) : 'not recorded'}`
  : `- Expert Vars: ${b.water_temp || 'Boiling'} Start, ${b.heat_level || 'Med'} Heat, ${b.flow_type || 'Steady'} Flow, Filter: ${b.has_paper_filter ? 'Yes' : 'No'}`}
- Tasting Notes: "${b.tasting_notes || 'None'}"`).join('\n')
  }

  const tier = ratingTier(vibe_rating)
  const it = language === 'it'

  // How this brew compares with earlier ones on the same setup (the model must not guess this)
  const earlierRatings = (previousBrews || []).map((b) => b.vibe_rating).filter((r): r is number => typeof r === 'number')
  const trendText = earlierRatings.length
    ? `Earlier brews on this setup averaged ${(earlierRatings.reduce((a, b) => a + b, 0) / earlierRatings.length).toFixed(1)}/10, so this one is ${
        vibe_rating > Math.max(...earlierRatings) ? 'the best so far'
        : vibe_rating < Math.min(...earlierRatings) ? 'the worst so far'
        : 'in the same range'}.`
    : 'There are no earlier brews on this setup to compare with.'

  const preinfusionSeconds = (pressure_profile || [])
    .filter((s) => s.type === 'preinfusion')
    .reduce((sum, s) => sum + s.duration_s, 0)
  const flowRate = extraction_time_s > 0 ? final_yield_g / extraction_time_s : null

  const brewDetails = espresso
    ? `- Dose: ${coffee_weight_g}g in, ${final_yield_g}g out (ratio 1:${extraction_ratio_output}) in ${extraction_time_s}s measured from the first drop in the cup${first_drip_s != null ? ` (the first drop came after ${first_drip_s}s, so ${Math.round((extraction_time_s + first_drip_s) * 10) / 10}s in total)` : ''}${flowRate ? ` (about ${flowRate.toFixed(2)} g/s)` : ''}
- Brew temperature: ${brew_temp_c != null ? brew_temp_c + '°C' : 'not recorded'}
- Pressure profile: ${profileText}${preinfusionSeconds ? ` (pre-infusion ${preinfusionSeconds}s)` : ''}
- Taste balance according to the user: ${taste_balance || 'not recorded'}
- Puck prep: ${used_wdt ? 'stirred (WDT)' : 'no WDT'}${has_paper_filter ? ', paper filter on puck' : ''}`
    : `- Coffee ${coffee_weight_g}g, water in boiler ${water_added_g}g, yield ${final_yield_g}g, brew ratio 1:${brew_ratio_input}, extraction ratio 1:${extraction_ratio_output}
- Extraction time: ${extraction_time_s}s
- Starting water temp: ${water_temp || 'Boiling'}
- Heat level: ${heat_level || 'Medium-Low'}
- Paper filter: ${has_paper_filter ? 'yes' : 'no'}
- Flow observation: ${flow_type || 'Steady'}
- Taste balance according to the user: ${taste_balance || 'not recorded'}`

  const equipment = espresso
    ? `Espresso machine: ${mokaPot?.brand} ${mokaPot?.model} (${mokaPot?.type}${mokaPot?.basket_diameter_mm ? `, ${mokaPot.basket_diameter_mm} mm basket` : ''})${portafilter ? `, portafilter: ${portafilter}` : ''}`
    : `Moka pot: ${mokaPot?.brand} ${mokaPot?.model} (${mokaPot?.size_cups} cup, ${mokaPot?.type})`

  const beanLine = mixText || `- Bean: ${bean?.name} (${bean?.roaster}) - Species: ${bean?.bean_type || 'Unknown'}${bean?.bean_type === 'Blend' && bean?.arabica_percent != null ? ` (${bean.arabica_percent}% Arabica)` : ''} - Origin: ${bean?.origin || 'Unknown'} - Roast: ${bean?.roast_level}${bean?.tasting_notes ? ` - Advertised flavour notes: "${bean.tasting_notes}"` : ''}`

  const tone = {
    positive: 'The user is happy. Be warm and celebratory in proportion to the rating (8 = pleased and proud, 9-10 = ecstatic). Never criticise the result.',
    mixed: 'The result was so-so. Be encouraging and constructive, mildly dramatic at most.',
    negative: 'The user is disappointed. Be sympathetic and a little dramatic, but always helpful and never mocking.',
  }[tier.group]

  const suggestionGuide = {
    positive: 'Name the settings worth keeping (quote the real values). Then give at most ONE small, clearly optional experiment, or simply suggest repeating the recipe. Do NOT tell the user to change things that already work.',
    mixed: 'Pick the single most likely lever and change only that one, with direction and amount.',
    negative: 'Identify the most likely cause from the tasting notes and give one or two precise changes with direction and amount.',
  }[tier.group]

  const knowledge = espresso
    ? `- Only when the notes or the taste balance say the shot was bitter/harsh: grind coarser, shorten or soften the ramp/decline, lower the brew temperature or stop the shot earlier.
- Only when they say sour/thin: grind finer, lengthen the pre-infusion, raise peak pressure or temperature, or let the shot run longer.
- Typical espresso reference points (use them for context only when the rating is 6 or below): ratio 1:1.5 to 1:3, roughly 25-35 s (conventions differ on when the timer starts), extraction yield 18-22%. A different recipe is not a flaw if the user rated it well.
- Refer to individual pressure stages by name when a profile is recorded.`
    : `- Only when the notes say bitter: grind coarser, lower the heat or start with cooler water. Only when they say sour: grind finer, raise the heat or start with warmer water.
- If flow was "Sputtering", mention heat management and the stop point.
- Refer to water as "starting water temp" with general terms (warmer, cooler, near boiling), never exact degrees.`

  const rules = `${knowledge}
- If the coffee is pre-ground, never suggest changing the grind size.
- Robusta adds body, crema and bitterness; Arabica adds sweetness and acidity. Dark roasts risk bitterness, light roasts risk sourness. Mention this only if it is relevant to the notes.
- Never invent facts that are not in the data.`

  const examples = {
    positive: it
      ? '{"summary":"Che bella tazza, dolce e piena di corpo: un otto meritatissimo!","suggestion":"Tieni esattamente queste impostazioni. Se vuoi giocare, prova mezzo punto di macinatura più fine la prossima volta, ma solo per curiosità."}'
      : '{"summary":"A sweet, full-bodied cup that fully earned its rating. Bravo!","suggestion":"Keep these exact settings, they are working. If you feel adventurous, try one tiny change next time, purely out of curiosity."}',
    mixed: it
      ? '{"summary":"Una tazza nella media: niente di male, ma ancora lontana dal suo potenziale.","suggestion":"Cambia una cosa sola: macina leggermente più fine per aumentare dolcezza e corpo."}'
      : '{"summary":"A middling cup: nothing wrong, but it is still holding back.","suggestion":"Change just one thing next time: grind slightly finer to add sweetness and body."}',
    negative: it
      ? '{"summary":"Peccato, la tazza era amara e aspra come hai scritto tu.","suggestion":"Macina più grossolano e riduci il calore: così l\'estrazione sarà più dolce."}'
      : '{"summary":"Peccato, the cup was as bitter as your notes say.","suggestion":"Grind coarser and ease off the heat so the extraction turns sweeter."}',
  }[tier.group]

  const prompt = `You are a coffee brewing coach with a warm, expressive Italian personality.
${it
? 'Write everything in Italian, with some colourful Italian flair and slang.'
: 'Write in clear, natural English and include some Italian flair here and there: an Italian word, expression or bit of slang woven naturally into the English, always matching the mood of the rating. The advice itself must stay fully understandable in English.'}
No emojis, no markdown, no bullet points; plain flowing text with dry, deadpan wit.

THE USER'S OWN VERDICT (ground truth, never contradict it):
The user rated this brew ${vibe_rating}/10, which means: ${tier.meaning}.
${tone}
${trendText}

TASK: return a JSON object with exactly two string keys.
1. "summary": 1-2 sentences describing this brew in line with the user's verdict. Use the tasting notes as your main evidence. Mention numbers (ratio, time, ...) only as supporting facts; do NOT judge them against an ideal on your own, because a recipe the user rated highly is a good recipe.
2. "suggestion": 2-3 sentences for the next brew. ${suggestionGuide}

CURRENT BREW (the one being reviewed)
${beanLine}${bean?.roast_date ? ` (roast date ${bean.roast_date}, ${daysPastRoast} days old)` : ''}
- ${equipment}
${grinder ? `- Grinder: ${grinder.brand} ${grinder.model}, setting ${grindSettingText}` : '- Coffee: pre-ground (no grinder used)'}
${brewDetails}
- Milk: ${milk_added_g ? `${milk_added_g}g ${milk_type || ''}` : 'none (black)'}
- User's tasting notes: "${tasting_notes || 'none provided'}"

EARLIER brews with this same setup (NOT the one being reviewed; use only for comparison)
${historyText}

GUIDANCE
${rules}

Respond with raw JSON only. Example of the expected style for a brew with a ${tier.group} rating (do not copy its words):
${examples}`

  let ai_recap = ''
  try {
    for (let attempt = 0; attempt < 2 && !ai_recap; attempt++) {
      const raw = await mistralComplete(prompt, { json: true, maxTokens: 500, temperature: 0.4 })
      if (!raw) break
      try {
        const parsed = JSON.parse(stripMarkdown(raw)) as { summary?: unknown; suggestion?: unknown }
        const summary = typeof parsed.summary === 'string' ? stripMarkdown(parsed.summary) : ''
        const suggestion = typeof parsed.suggestion === 'string' ? stripMarkdown(parsed.suggestion) : ''
        if (!summary || !suggestion) throw new Error('missing keys')
        if (toneContradictsRating(tier.group, summary, suggestion)) {
          console.warn(`Recap contradicted the ${vibe_rating}/10 rating, retrying`)
          continue
        }
        ai_recap = JSON.stringify({ summary, suggestion })
      } catch (parseError) {
        console.error('Recap model returned unusable JSON:', raw, parseError)
      }
    }

    // Canned fallback if the model is unavailable or kept contradicting the rating
    if (!ai_recap) {
      const subject = espresso ? 'espresso' : 'moka pot'
      let summary: string
      let suggestion: string
      if (tier.group === 'negative') {
        summary = it
          ? `Peccato, questa tazza ti ha deluso (${vibe_rating}/10).`
          : `Peccato, this one let you down (${vibe_rating}/10).`
        suggestion = (tasting_notes || '').toLowerCase().match(/bitter|amar/)
          ? (it ? 'Prova una macinatura più grossolana e meno calore o pressione.' : 'Try a coarser grind and gentler heat or pressure next time.')
          : (tasting_notes || '').toLowerCase().match(/sour|acid/)
            ? (it ? 'Prova una macinatura più fine per estrarre più dolcezza.' : 'Try a finer grind to pull out more sweetness.')
            : (it ? 'Cambia una sola variabile, per esempio la macinatura, e riprova.' : 'Change just one variable, for example the grind, and try again.')
      } else if (tier.group === 'mixed') {
        summary = it ? `Una tazza nella media (${vibe_rating}/10): c'è margine.` : `A middling cup (${vibe_rating}/10): there is room to grow.`
        suggestion = it ? 'Cambia una sola cosa alla volta, per esempio la macinatura, e confronta.' : 'Change one thing at a time, such as the grind, and compare.'
      } else {
        summary = it ? `Bella tazza, ${vibe_rating}/10 meritatissimo!` : `A lovely cup, a well-earned ${vibe_rating}/10!`
        suggestion = it
          ? `Tieni queste impostazioni: per il tuo ${subject} funzionano.`
          : `Keep these settings, they clearly work for your ${subject}.`
      }
      ai_recap = JSON.stringify({ summary, suggestion })
    }
  } catch (error) {
    console.error('Error generating AI recap:', error)
  }
  return ai_recap
}

export type Tier = { group: 'positive' | 'mixed' | 'negative'; meaning: string }

/** Turns the 1-10 rating into a verdict the model has to respect. */
export function ratingTier(rating: number): Tier {
  if (rating >= 9) return { group: 'positive', meaning: 'outstanding, one of the best cups they could hope for' }
  if (rating >= 7) return { group: 'positive', meaning: 'a good to very good cup that they are happy with' }
  if (rating >= 5) return { group: 'mixed', meaning: 'an average, so-so cup with room to improve' }
  if (rating >= 3) return { group: 'negative', meaning: 'a poor cup that they did not enjoy' }
  return { group: 'negative', meaning: 'a bad cup, close to undrinkable for them' }
}

const NEGATIVE_WORDS = /terrible|disaster|disastro|sacril|undrinkable|heartbroken|awful|horrible|orrend|schifo|far too (low|high)|ruined|failure/i
const GLOWING_WORDS = /masterpiece|capolavoro|flawless|impeccab|ecstatic|perfection|magnifico|splendid/i

/** Small safety net: catches the rare answer whose mood is the opposite of the user's rating. */
export function toneContradictsRating(group: Tier['group'], summary: string, suggestion: string): boolean {
  if (group === 'positive') return NEGATIVE_WORDS.test(`${summary} ${suggestion}`)
  if (group === 'negative') return GLOWING_WORDS.test(summary)
  return false
}
