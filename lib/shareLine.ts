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
      'Nonna would approve, and she never approves of anything.',
      'Espresso at the bar? No thanks, I have this.',
      'Chef’s kiss. Pinched fingers and everything.',
    ],
    mixed: [
      'Not a masterpiece, not a crime. Coffee is a journey.',
      'Così così, but the ritual still counts.',
      'The nonna shrugged. I will take it.',
    ],
    negative: [
      'This cup has been sent to the shadow realm. We do not speak of it.',
      'Sacrilegio! Please do not tell my nonna.',
      'This cup shall never leave the kitchen.',
    ],
  },
  it: {
    positive: [
      'La nonna approverebbe, e lei non approva mai niente.',
      'Il caffè al bar? No grazie, ho questo.',
      'Bacio dello chef. Con tanto di dita a pizzico.',
    ],
    mixed: [
      'Né un capolavoro né un crimine: il caffè è un viaggio.',
      'Così così, ma il rito conta comunque.',
      'La nonna ha alzato le spalle. Mi accontento.',
    ],
    negative: [
      'Questa tazza non uscirà mai da questa cucina.',
      'Sacrilegio! Non ditelo alla nonna.',
      'Questa tazza è stata mandata nel regno delle ombre. Non se ne parla.',
    ],
  },
}

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

  const prompt = `You write captions for a coffee lover's photo of their cup, to be posted for friends.
Write ONE short, funny line, at most 90 characters, with a nod to Italian coffee culture (nonna, the espresso at the bar, the moka on the stove, mamma mia, la dolce vita...).
${it ? 'Write it in Italian.' : 'Write it in English; at most one or two Italian words.'}
The user rated the cup ${input.rating}/10 (${tier.meaning}). ${mood}
Rules: light-hearted banter only. No grind, settings, numbers or technique advice. No hashtags, no emoji, no quotation marks. Do not repeat the rating as a number. You may play on the coffee or the tasting notes.

${facts.join('\n')}

Return raw JSON with exactly one key: {"share":"..."}`

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await mistralComplete(prompt, { json: true, maxTokens: 120, temperature: 0.9 })
    if (!raw) break
    try {
      const parsed = JSON.parse(stripMarkdown(raw)) as { share?: unknown }
      const line = typeof parsed.share === 'string' ? stripMarkdown(parsed.share).replace(/^["“]+|["”]+$/g, '').trim() : ''
      if (!line || line.length > HARD_MAX) continue
      if (toneContradictsRating(tier.group, line, '')) continue
      return line
    } catch {
      // fall through to the next attempt
    }
  }
  return pick(FALLBACKS[input.language][tier.group])
}
