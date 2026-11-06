import { mistralComplete, stripMarkdown } from './mistral'
import { ratingTier, toneContradictsRating, type Tier } from './brewRecap'

/** The prompt asks for at most 90 characters; a little slack before we give up on the model's answer. */
const HARD_MAX = 110

export interface ShareLineInput {
  rating: number
  beanName: string
  origin?: string | null
  roast?: string | null
  brewer: 'espresso' | 'moka pot'
  milk?: string | null
  notes?: string | null
  tasteBalance?: string | null
  language: 'en' | 'it'
}

const FALLBACKS: Record<'en' | 'it', Record<Tier['group'], string[]>> = {
  en: {
    positive: [
      'Espresso at the bar? No thanks, I have this.',
      'Chef’s kiss. Pinched fingers and everything.',
      'Pavarotti just hit a high note somewhere.',
      'Monday has been officially cancelled.',
      'La dolce vita, now in a cup.',
      'I would like to thank the bean, the water and my own genius.',
    ],
    mixed: [
      'Not a masterpiece, not a crime. Coffee is a journey.',
      'Così così, but the ritual still counts.',
      'A solid B-movie of a coffee.',
      'The Roman traffic of cups: chaotic, but it arrived.',
      'Fuel acquired. Poetry pending.',
      'Perfectly fine, which is the most Italian shrug there is.',
    ],
    negative: [
      'This cup has been sent to the shadow realm. We do not speak of it.',
      'Sacrilegio! Please do not tell any Italian.',
      'This cup shall never leave the kitchen.',
      'Fellini could not have staged a bigger tragedy.',
      'I have made a terrible mistake, and it is in a cup.',
      'The barista would have walked out on this one.',
    ],
  },
  it: {
    positive: [
      'Il caffè al bar? No grazie, ho questo.',
      'Bacio dello chef. Con tanto di dita a pizzico.',
      'Da qualche parte Pavarotti ha appena preso un acuto.',
      'Il lunedì è ufficialmente annullato.',
      'La dolce vita, adesso in tazza.',
      'Ringrazio il chicco, l’acqua e il mio genio.',
    ],
    mixed: [
      'Né un capolavoro né un crimine: il caffè è un viaggio.',
      'Così così, ma il rito conta comunque.',
      'Un bel film di serie B, in versione caffè.',
      'Il traffico di Roma in una tazza: caotico, ma è arrivato.',
      'Carburante ottenuto. Poesia in arrivo.',
      'Perfettamente discreto, cioè il più italiano dei sospiri.',
    ],
    negative: [
      'Questa tazza non uscirà mai da questa cucina.',
      'Sacrilegio! Non ditelo a nessun italiano.',
      'Questa tazza è stata mandata nel regno delle ombre. Non se ne parla.',
      'Nemmeno Fellini avrebbe messo in scena una tragedia così.',
      'Ho fatto un terribile errore, ed è in una tazza.',
      'Il barista se ne sarebbe andato.',
    ],
  },
}

/**
 * Comedy angles. A random few are offered on every call so the captions stop circling the same joke.
 * Italian culture is a flavour, not a requirement, so general coffee humour is mixed in.
 */
const ANGLES = [
  'an espresso knocked back standing at the bar',
  'Vespas and Roman traffic',
  'a Sunday lunch that lasts until dinner',
  'Italian hand gestures',
  'opera-level drama (a diva, Pavarotti)',
  'calcio: football passion and a referee who got it wrong',
  'la dolce vita and doing nothing beautifully',
  'the barista silently judging your order',
  'the unwritten rules (no cappuccino after 11am)',
  'comparing the cup to pasta, pizza or tiramisu',
  'a Renaissance masterpiece (Michelangelo, Leonardo)',
  'Mediterranean sunshine and the Amalfi coast',
  'a Fellini film',
  'pretending to be a morning person on a Monday',
  'caffeine as a personality trait',
  'being unreasonably serious about coffee, like a snob or a scientist',
  'answering emails or being productive',
  'what the cat, the dog or the neighbours would say',
  'a dramatic movie-trailer voice',
  'treating the cup like a first date or a sports match',
  'a superhero origin story',
  'the sunrise ritual and the quiet kitchen',
]

/** Nonna is funny exactly once; she only joins the pool occasionally. */
const NONNA_ODDS = 0.1

const sample = <T,>(list: T[], n: number): T[] => [...list].sort(() => Math.random() - 0.5).slice(0, n)

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** One short, funny line to post next to a picture of the cup. Generated on demand, never stored. */
export async function generateShareLine(input: ShareLineInput): Promise<string> {
  const tier = ratingTier(input.rating)
  const it = input.language === 'it'

  const facts = [
    `Coffee: ${input.beanName}${input.origin ? ` from ${input.origin}` : ''}${input.roast ? `, ${input.roast} roast` : ''}`,
    `Made with: ${input.brewer}`,
    input.milk ? `With milk: ${input.milk}` : '',
    input.tasteBalance ? `Tastes: ${input.tasteBalance}` : '',
    input.notes ? `The user's tasting notes: "${input.notes.slice(0, 200)}"` : '',
  ].filter(Boolean)

  const mood = {
    positive: 'The user loved it: be proud and a little smug.',
    mixed: 'The user thought it was so-so: be shruggingly philosophical.',
    negative: 'The user did not enjoy it: be dramatic and self-deprecating (never mean).',
  }[tier.group]

  const allowNonna = Math.random() < NONNA_ODDS
  const angles = sample(allowNonna ? [...ANGLES, 'what nonna would say'] : ANGLES, 3)

  const prompt = `You write captions for a coffee lover's photo of their cup, to be posted for friends.
Write ONE short, funny line, at most 90 characters. Be witty and original, not generic.
${it ? 'Write it in Italian, with some colourful slang.' : 'Write it in English with some Italian flair: an Italian word or expression where it fits.'}
Take your inspiration from ONE of these angles (use whichever gives the funniest line, or a better idea of your own): ${angles.join('; ')}.
${allowNonna ? '' : 'Do NOT mention nonna, grandmothers or grandmas.\n'}Do not start with "Nonna" and do not use the phrase "mamma mia".
The user rated the cup ${input.rating}/10 (${tier.meaning}). ${mood}
Rules: light-hearted banter only. No grind, settings, numbers or technique advice. No hashtags, no emoji, no quotation marks. Do not repeat the rating as a number. You may play on the coffee or the tasting notes.

${facts.join('\n')}

Return raw JSON with exactly one key: {"share":"..."}`

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await mistralComplete(prompt, { json: true, maxTokens: 120, temperature: 1 })
    if (!raw) break
    try {
      const parsed = JSON.parse(stripMarkdown(raw)) as { share?: unknown }
      const line = typeof parsed.share === 'string' ? stripMarkdown(parsed.share).replace(/^["“]+|["”]+$/g, '').trim() : ''
      if (!line || line.length > HARD_MAX) continue
      if (toneContradictsRating(tier.group, line, '')) continue
      if (!allowNonna && /nonn|grandm|grandma/i.test(line)) continue
      return line
    } catch {
      // fall through to the next attempt
    }
  }
  return pick(FALLBACKS[input.language][tier.group])
}
