/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import { getErrorMessage, getErrorStack } from '@/lib/errors'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ESPRESSO_MACHINE_TYPES, normalizeBrewerKind, normalizeMokaPotType } from '@/lib/dbValues'

/** Validates a brewing-gear payload (moka pot or espresso machine) into DB columns. */
function parseBrewer(body: any): { error: string } | { fields: Record<string, unknown> } {
  const kind = normalizeBrewerKind(body.kind)
  const { brand, model, type } = body
  const nickname = typeof body.nickname === 'string' && body.nickname.trim() ? body.nickname.trim().slice(0, 50) : null
  if (!brand || !model) return { error: 'Missing required fields: brand, model' }

  if (kind === 'espresso') {
    const pressure = body.max_pressure_bar === '' || body.max_pressure_bar == null ? null : Number(body.max_pressure_bar)
    if (pressure !== null && (!Number.isFinite(pressure) || pressure <= 0 || pressure > 20)) {
      return { error: 'Max pressure must be between 0 and 20 bar' }
    }
    const machineType = (ESPRESSO_MACHINE_TYPES as readonly string[]).includes(type) ? type : ESPRESSO_MACHINE_TYPES[0]
    return { fields: { kind, brand, model, nickname, type: machineType, size_cups: null, max_pressure_bar: pressure } }
  }

  const sizeCups = Number(body.size_cups)
  if (!type || !(sizeCups > 0)) return { error: 'Missing required fields: brand, model, type, size_cups' }
  return {
    fields: { kind, brand, model, nickname, type: normalizeMokaPotType(type), size_cups: sizeCups, max_pressure_bar: null },
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a client with the user's token so RLS policies work
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { data, error } = await userClient
      .from('moka_pots')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = parseBrewer(await request.json())
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

    // Create a client with the user's token so RLS policies work
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { data, error } = await userClient
      .from('moka_pots')
      .insert([
        { user_id: user.id, ...parsed.fields },
      ])
      .select()

    if (error) {
      console.error('Supabase moka_pots insert error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/moka-pots error:', getErrorMessage(err), getErrorStack(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const parsed = parseBrewer(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data, error } = await userClient
      .from('moka_pots')
      .update(parsed.fields)
      .eq('id', body.id)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data[0])
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Create a client with the user's token so RLS policies work
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { error } = await userClient
      .from('moka_pots')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
