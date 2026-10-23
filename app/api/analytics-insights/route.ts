import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/serverAuth'
import { mistralComplete, stripMarkdown } from '@/lib/mistral'
import { getErrorMessage } from '@/lib/errors'

type Lang = 'en' | 'it'

const voice = (language: Lang) =>
  language === 'it'
    ? 'RESPOND IN ITALIAN.'
    : 'RESPOND IN ENGLISH. Italian is only allowed as at most one short exclamation in the whole answer.'

const style = `You are a veteran Italian barista who takes moka pots far too seriously. Your tone is dry, deadpan and warm. Never use emojis, markdown, asterisks or bullet characters. Be specific: quote the actual numbers you are given and never invent data that is not in the input. This is for a MOKA POT, not espresso or pour-over.`

const asStrings = (value: unknown, max: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map((v) => stripMarkdown(v))
        .slice(0, max)
    : []

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { kind?: string; language?: string; payload?: unknown }
    const language: Lang = body.language === 'it' ? 'it' : 'en'
    if (!body.payload || typeof body.payload !== 'object') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
    }
    const data = JSON.stringify(body.payload).slice(0, 12000)

    if (body.kind === 'simulation') {
      const prompt = `${style}

A user is exploring a "what if" in a simulator: they moved a slider away from a coffee they actually brewed. The numbers below are ESTIMATES from a small model fitted to their own brew history plus general coffee knowledge, not measurements. Give a short verdict (2 to 3 sentences, max 70 words) on what this change would likely do to the cup, mention how trustworthy the estimate is given the amount of data (the "confidence" field), and say whether they should actually try it.
Return raw JSON with exactly one key: "verdict" (a plain string).
${voice(language)}

SIMULATION:
${data}`
      const raw = await mistralComplete(prompt, { json: true, maxTokens: 300 })
      if (!raw) return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
      try {
        const parsed = JSON.parse(stripMarkdown(raw)) as { verdict?: unknown }
        const verdict = typeof parsed.verdict === 'string' ? stripMarkdown(parsed.verdict) : ''
        if (!verdict) throw new Error('empty verdict')
        return NextResponse.json({ verdict })
      } catch {
        return NextResponse.json({ error: 'AI returned an unreadable answer' }, { status: 502 })
      }
    }

    const prompt = `${style}

Below are aggregate statistics and the most recent brews of one user. Write a candid coaching report. Return raw JSON with exactly these keys:
- "headline": one sentence (max 25 words) summing up where this person is at.
- "good": array of 2 to 4 short strings on what is going well.
- "bad": array of 0 to 3 short strings on what is going badly (empty array if truly nothing, do not invent problems).
- "improve": array of 2 to 4 short, concrete, actionable strings on what to change next (grinder clicks, heat, starting water, dose, freshness, paper filter, which beans to keep or drop). Prefer one change at a time.
- "experiment": one string describing the single most informative next brew to try.
Every string must be at most 35 words and use the real numbers provided. If there is little data, say so honestly instead of guessing.
Do not suggest changing the grind for pre-ground coffee. Refer to water as "starting water" and use general terms (warmer, cooler) rather than exact degrees.
${voice(language)}

DATA:
${data}`

    const raw = await mistralComplete(prompt, { json: true, maxTokens: 900 })
    if (!raw) return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
    try {
      const parsed = JSON.parse(stripMarkdown(raw)) as Record<string, unknown>
      const headline = typeof parsed.headline === 'string' ? stripMarkdown(parsed.headline) : ''
      const experiment = typeof parsed.experiment === 'string' ? stripMarkdown(parsed.experiment) : ''
      const result = {
        headline,
        good: asStrings(parsed.good, 4),
        bad: asStrings(parsed.bad, 3),
        improve: asStrings(parsed.improve, 4),
        experiment,
      }
      if (!result.headline && !result.good.length && !result.improve.length) throw new Error('empty report')
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ error: 'AI returned an unreadable answer' }, { status: 502 })
    }
  } catch (err) {
    console.error('analytics-insights error:', getErrorMessage(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
