/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateBrewRatio, calculateExtractionRatio } from '@/lib/utils'
import { getAuthedContext, fetchAllRows } from '@/lib/serverAuth'
import { generateBrewRecap } from '@/lib/brewRecap'
import {
  normalizeFlowType,
  normalizeHeatLevel,
  normalizeMilkType,
  normalizeWaterTemp,
} from '@/lib/dbValues'

const BREW_SELECT = `
  *,
  bean:beans (*),
  grinder:grinders (*),
  moka_pot:moka_pots (*),
  mix:brew_beans (bean_id, percentage, bean:beans (*))
`

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

/** Strips characters that would break PostgREST filter syntax. */
const sanitizeSearch = (q: string) => q.replace(/[,()%*\\]/g, ' ').trim()

/** Adjusts a bean's remaining weight. Positive `grams` consumes stock, negative restores it. */
async function adjustBeanStock(client: SupabaseClient, beanId: string, grams: number) {
  if (!grams) return
  const { data: bean } = await client.from('beans').select('weight_g').eq('id', beanId).maybeSingle()
  if (!bean || bean.weight_g === null || bean.weight_g === undefined) return
  const next = Math.max(0, Math.round(Number(bean.weight_g) - grams))
  await client.from('beans').update({ weight_g: next }).eq('id', beanId)
}

type MixItem = { bean_id: string; percentage: number }

/** Grams of coffee drawn from each bean bag for a brew (single bean or mix). */
const stockShares = (beanId: string, grams: number, mix: MixItem[] | null | undefined) =>
  mix && mix.length > 1
    ? mix.map((c) => ({ bean_id: c.bean_id, grams: (grams * c.percentage) / 100 }))
    : [{ bean_id: beanId, grams }]

async function applyStock(
  client: SupabaseClient,
  beanId: string,
  grams: number,
  mix: MixItem[] | null | undefined,
  direction: 1 | -1
) {
  for (const share of stockShares(beanId, grams, mix)) {
    await adjustBeanStock(client, share.bean_id, share.grams * direction)
  }
}

async function replaceMix(client: SupabaseClient, userId: string, brewId: string, mix: MixItem[] | null) {
  await client.from('brew_beans').delete().eq('brew_id', brewId)
  if (mix && mix.length > 1) {
    await client
      .from('brew_beans')
      .insert(mix.map((c) => ({ brew_id: brewId, user_id: userId, bean_id: c.bean_id, percentage: c.percentage })))
  }
}

type BrewFields = {
  bean_id: string
  grinder_id: string | null
  moka_pot_id: string
  grinder_setting: number | null
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  extraction_time_s: number
  milk_added_g: number | null
  milk_type: string | null
  vibe_rating: number
  tasting_notes: string
  water_temp: string
  heat_level: string
  has_paper_filter: boolean
  flow_type: string
}

/** Validates and normalises a brew payload. Returns an error string on failure. */
function parseBrewBody(body: any): { error: string } | { fields: BrewFields; mix: MixItem[] | null } {
  const coffee = parseFloat(body.coffee_weight_g)
  const water = parseFloat(body.water_added_g)
  const yieldOut = parseFloat(body.final_yield_g)
  const time = parseInt(body.extraction_time_s)
  const rating = parseInt(body.vibe_rating)

  // Optional mix of several beans: whole percentages summing to 100, no duplicates
  let mix: MixItem[] | null = null
  if (Array.isArray(body.mix) && body.mix.length > 1) {
    mix = body.mix.map((c: any) => ({ bean_id: String(c?.bean_id || ''), percentage: Math.round(Number(c?.percentage)) }))
    const ids = new Set(mix!.map((c) => c.bean_id))
    if (
      ids.size !== mix!.length ||
      ids.has('') ||
      mix!.some((c) => !Number.isFinite(c.percentage) || c.percentage < 1 || c.percentage > 99) ||
      mix!.reduce((sum, c) => sum + c.percentage, 0) !== 100
    ) {
      return { error: 'Bean mix percentages must add up to 100%' }
    }
    // The largest component is the brew's main bean
    body.bean_id = [...mix!].sort((a, b) => b.percentage - a.percentage)[0].bean_id
  }

  if (!body.bean_id || !body.moka_pot_id) return { error: 'Missing required fields' }
  if (![coffee, water, yieldOut, time, rating].every(Number.isFinite)) {
    return { error: 'Missing required fields' }
  }
  if (coffee <= 0 || water <= 0 || yieldOut < 0 || time < 0) {
    return { error: 'Weights must be positive numbers' }
  }
  if (rating < 1 || rating > 10) return { error: 'Rating must be between 1 and 10' }

  const grinderSetting =
    body.grinder_setting !== undefined && body.grinder_setting !== '' && body.grinder_setting !== null
      ? parseInt(body.grinder_setting)
      : null
  const milk = body.milk_added_g ? parseFloat(body.milk_added_g) : null

  return {
    fields: {
      bean_id: body.bean_id,
      grinder_id: body.grinder_id || null,
      moka_pot_id: body.moka_pot_id,
      grinder_setting: Number.isFinite(grinderSetting) ? grinderSetting : null,
      coffee_weight_g: coffee,
      water_added_g: water,
      final_yield_g: yieldOut,
      extraction_time_s: time,
      milk_added_g: milk && Number.isFinite(milk) ? milk : null,
      milk_type: milk ? normalizeMilkType(body.milk_type) : null,
      vibe_rating: rating,
      tasting_notes: body.tasting_notes || '',
      water_temp: normalizeWaterTemp(body.water_temp),
      heat_level: normalizeHeatLevel(body.heat_level),
      has_paper_filter: !!body.has_paper_filter,
      flow_type: normalizeFlowType(body.flow_type),
    },
    mix,
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return unauthorized()
    const { client } = ctx

    const sp = new URL(request.url).searchParams

    // Lightweight totals for the dashboard (not limited by pagination)
    if (sp.get('stats') === '1') {
      const rows = await fetchAllRows<{ vibe_rating: number }>((from, to) =>
        client.from('brews').select('vibe_rating').order('created_at', { ascending: false }).range(from, to)
      )
      const total = rows.length
      const avg = total ? rows.reduce((sum, r) => sum + (r.vibe_rating || 0), 0) / total : null
      const { data: latest } = await client
        .from('brews')
        .select('id, ai_recap, vibe_rating, bean:beans(name), mix:brew_beans(percentage, bean:beans(name))')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return NextResponse.json({ total, avg_rating: avg, latest })
    }

    const q = sanitizeSearch(sp.get('q') || '')
    let matchingBeanIds: string[] = []
    if (q) {
      const { data } = await client
        .from('beans')
        .select('id')
        .or(`name.ilike.%${q}%,roaster.ilike.%${q}%,origin.ilike.%${q}%`)
      matchingBeanIds = (data || []).map((b: { id: string }) => b.id)
    }

    const sort = sp.get('sort') || 'newest'

    const build = (select: string, opts?: { count?: 'exact' }) => {
      let query: any = client.from('brews').select(select, opts)

      if (q) {
        const parts = [`tasting_notes.ilike.%${q}%`]
        if (matchingBeanIds.length) parts.push(`bean_id.in.(${matchingBeanIds.join(',')})`)
        query = query.or(parts.join(','))
      }
      if (sp.get('bean_id')) query = query.eq('bean_id', sp.get('bean_id'))
      if (sp.get('moka_pot_id')) query = query.eq('moka_pot_id', sp.get('moka_pot_id'))
      if (sp.get('min_rating')) query = query.gte('vibe_rating', parseInt(sp.get('min_rating')!))
      if (sp.get('max_rating')) query = query.lte('vibe_rating', parseInt(sp.get('max_rating')!))
      if (sp.get('from')) query = query.gte('created_at', sp.get('from'))
      if (sp.get('to')) query = query.lte('created_at', `${sp.get('to')}T23:59:59.999Z`)

      if (sort === 'oldest') query = query.order('created_at', { ascending: true })
      else if (sort === 'rating') {
        query = query.order('vibe_rating', { ascending: false }).order('created_at', { ascending: false })
      } else query = query.order('created_at', { ascending: false })

      return query
    }

    // Everything, for analytics / export. Pages through PostgREST's row cap.
    if (sp.get('all') === '1') {
      const rows = await fetchAllRows<any>((from, to) => build(BREW_SELECT).range(from, to))
      return NextResponse.json(rows)
    }

    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') || '20') || 20))
    const page = Math.max(1, parseInt(sp.get('page') || '1') || 1)
    const from = (page - 1) * pageSize

    const { data, error, count } = await build(BREW_SELECT, { count: 'exact' }).range(from, from + pageSize - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, total: count ?? 0, page, pageSize })
  } catch (err) {
    console.error('GET /api/brews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return unauthorized()
    const { user, client } = ctx

    const body = await request.json()
    const parsed = parseBrewBody(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const f = parsed.fields
    const mix = parsed.mix

    const brew_ratio_input = calculateBrewRatio(f.coffee_weight_g, f.water_added_g)
    const extraction_ratio_output = calculateExtractionRatio(f.coffee_weight_g, f.final_yield_g)

    let ai_recap = ''
    try {
      ai_recap = await generateBrewRecap(client, {
        ...f,
        brew_ratio_input,
        extraction_ratio_output,
        mix,
        language: body.language === 'it' ? 'it' : 'en',
      })
    } catch (error) {
      console.error('Error generating AI recap:', error)
    }

    const { data, error } = await client
      .from('brews')
      .insert([{ user_id: user.id, ...f, brew_ratio_input, extraction_ratio_output, ai_recap }])
      .select(BREW_SELECT)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await replaceMix(client, user.id, data[0].id, mix)
    await applyStock(client, f.bean_id, f.coffee_weight_g, mix, 1)

    const { data: full } = await client.from('brews').select(BREW_SELECT).eq('id', data[0].id).single()
    return NextResponse.json(full ?? data[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/brews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return unauthorized()
    const { client, user } = ctx

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const parsed = parseBrewBody(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const f = parsed.fields
    const mix = parsed.mix

    const { data: existing } = await client
      .from('brews')
      .select('bean_id, coffee_weight_g, mix:brew_beans(bean_id, percentage)')
      .eq('id', body.id)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Brew not found' }, { status: 404 })

    const brew_ratio_input = calculateBrewRatio(f.coffee_weight_g, f.water_added_g)
    const extraction_ratio_output = calculateExtractionRatio(f.coffee_weight_g, f.final_yield_g)

    let ai_recap: string | undefined
    if (body.regenerate_recap !== false) {
      try {
        ai_recap = await generateBrewRecap(
          client,
          {
            ...f,
            brew_ratio_input,
            extraction_ratio_output,
            mix,
            language: body.language === 'it' ? 'it' : 'en',
          },
          body.id
        )
      } catch (error) {
        console.error('Error generating AI recap:', error)
      }
    }

    const { data, error } = await client
      .from('brews')
      .update({
        ...f,
        brew_ratio_input,
        extraction_ratio_output,
        ...(ai_recap ? { ai_recap } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select(BREW_SELECT)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Keep the mix and bean stock in sync with the edit
    await applyStock(client, existing.bean_id, Number(existing.coffee_weight_g), existing.mix as MixItem[], -1)
    await replaceMix(client, user.id, body.id, mix)
    await applyStock(client, f.bean_id, f.coffee_weight_g, mix, 1)

    const { data: full } = await client.from('brews').select(BREW_SELECT).eq('id', body.id).single()
    return NextResponse.json(full ?? data[0])
  } catch (err) {
    console.error('PUT /api/brews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Toggles the public share link of a brew. Body: { id, share: boolean } */
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return unauthorized()
    const { client } = ctx

    const { id, share } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const share_token = share ? randomUUID() : null
    const { data, error } = await client
      .from('brews')
      .update({ share_token })
      .eq('id', id)
      .select('id, share_token')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/brews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthedContext(request)
    if (!ctx) return unauthorized()
    const { client } = ctx

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: existing } = await client
      .from('brews')
      .select('bean_id, coffee_weight_g, mix:brew_beans(bean_id, percentage)')
      .eq('id', id)
      .maybeSingle()

    const { error } = await client.from('brews').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Put the coffee back into the bean's stock
    if (existing) {
      await applyStock(client, existing.bean_id, Number(existing.coffee_weight_g), existing.mix as MixItem[], -1)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/brews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
