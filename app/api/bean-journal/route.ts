import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeRoastLevel } from '@/lib/dbValues'
import { buildBeanCatalog, makeJournalKeys, sortBeanCatalog, BeanCatalogSort } from '@/lib/beanJournal'

function userClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sort = (request.nextUrl.searchParams.get('sort') || 'rating_desc') as BeanCatalogSort
    const client = userClient(token!)

    const [journalRes, brewsRes, beansRes] = await Promise.all([
      client.from('bean_journal').select('*').order('updated_at', { ascending: false }),
      client.from('brews').select('*, bean:beans (*), grinder:grinders(*)').order('created_at', { ascending: false }),
      client.from('beans').select('*'),
    ])

    if (journalRes.error) {
      return NextResponse.json({ error: journalRes.error.message }, { status: 500 })
    }
    if (brewsRes.error) {
      return NextResponse.json({ error: brewsRes.error.message }, { status: 500 })
    }

    const catalog = sortBeanCatalog(
      buildBeanCatalog(journalRes.data || [], brewsRes.data || [], beansRes.data || []),
      sort
    )

    return NextResponse.json(catalog)
  } catch (err) {
    console.error('GET /api/bean-journal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, roaster, roast_level, personal_rating, flavor_notes } = body

    if (!name?.trim() || !roaster?.trim()) {
      return NextResponse.json({ error: 'Name and roaster are required' }, { status: 400 })
    }

    const keys = makeJournalKeys(name, roaster)
    const client = userClient(token!)

    const payload = {
      user_id: user.id,
      name: name.trim(),
      roaster: roaster.trim(),
      ...keys,
      roast_level: roast_level ? normalizeRoastLevel(roast_level) : null,
      personal_rating:
        personal_rating != null && personal_rating !== ''
          ? parseInt(String(personal_rating), 10)
          : null,
      flavor_notes: flavor_notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await client
      .from('bean_journal')
      .select('id')
      .eq('user_id', user.id)
      .eq('name_key', keys.name_key)
      .eq('roaster_key', keys.roaster_key)
      .maybeSingle()

    let result
    if (existing?.id) {
      const { data, error } = await client
        .from('bean_journal')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    } else {
      const { data, error } = await client.from('bean_journal').insert([payload]).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    }

    return NextResponse.json(result, { status: existing?.id ? 200 : 201 })
  } catch (err) {
    console.error('POST /api/bean-journal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, name, roaster, roast_level, personal_rating, flavor_notes } = body

    if (!id || !name?.trim() || !roaster?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const keys = makeJournalKeys(name, roaster)
    const client = userClient(token!)

    const { data, error } = await client
      .from('bean_journal')
      .update({
        name: name.trim(),
        roaster: roaster.trim(),
        ...keys,
        roast_level: roast_level ? normalizeRoastLevel(roast_level) : null,
        personal_rating:
          personal_rating != null && personal_rating !== ''
            ? parseInt(String(personal_rating), 10)
            : null,
        flavor_notes: flavor_notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('PUT /api/bean-journal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const client = userClient(token!)
    const { error } = await client.from('bean_journal').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/bean-journal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
