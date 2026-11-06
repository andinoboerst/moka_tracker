import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/serverAuth'
import { generateShareLine } from '@/lib/shareLine'

/** Generates the short funny caption for a brew's share image. Called only when the user shares or downloads. */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, language } = (await request.json()) as { id?: string; language?: string }
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: brew } = await ctx.client
      .from('brews')
      .select('vibe_rating, tasting_notes, taste_balance, milk_added_g, milk_type, bean:beans(name, origin, roast_level), moka_pot:moka_pots(kind), mix:brew_beans(percentage, bean:beans(name))')
      .eq('id', id)
      .maybeSingle()
    if (!brew) return NextResponse.json({ error: 'Brew not found' }, { status: 404 })

    // PostgREST types embedded rows as arrays; they are single objects here
    const one = <T,>(value: T | T[] | null | undefined): T | undefined => (Array.isArray(value) ? value[0] : (value ?? undefined))
    const bean = one(brew.bean as unknown as { name: string; origin?: string; roast_level?: string } | null)
    const pot = one(brew.moka_pot as unknown as { kind?: string } | null)
    const mix = (brew.mix as unknown as { percentage: number; bean: { name: string } | { name: string }[] | null }[] | null) ?? []

    const beanName =
      mix.length > 1
        ? mix.map((m) => `${m.percentage}% ${one(m.bean)?.name ?? ''}`).join(' + ')
        : (bean?.name ?? 'coffee')

    const share = await generateShareLine({
      rating: brew.vibe_rating,
      beanName,
      origin: bean?.origin,
      roast: bean?.roast_level,
      brewer: pot?.kind === 'espresso' ? 'espresso' : 'moka pot',
      milk: brew.milk_added_g ? (brew.milk_type || 'milk') : null,
      notes: brew.tasting_notes,
      tasteBalance: brew.taste_balance,
      language: language === 'it' ? 'it' : 'en',
    })
    return NextResponse.json({ share })
  } catch (err) {
    console.error('POST /api/share-line error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
