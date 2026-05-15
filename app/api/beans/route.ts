import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeRoastLevel } from '@/lib/dbValues'

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
      .from('beans')
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
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, roaster, roast_level, roast_date, origin, weight_g, is_active, is_pre_ground } = body

    if (!name || !roaster || !roast_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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
      .from('beans')
      .insert([
        {
          user_id: user.id,
          name,
          roaster,
          roast_level: normalizeRoastLevel(roast_level),
          roast_date: roast_date || null,
          origin: origin || null,
          weight_g: weight_g ? parseInt(weight_g) : null,
          is_active: is_active !== undefined ? is_active : true,
          is_pre_ground: !!is_pre_ground,
        },
      ])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (err: any) {
    console.error('POST /api/beans error:', err.message, err.stack)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, roaster, roast_level, roast_date, origin, weight_g, is_active, is_pre_ground } = body

    if (!id || !name || !roaster || !roast_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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
      .from('beans')
      .update({
        name,
        roaster,
        roast_level: normalizeRoastLevel(roast_level),
        roast_date: roast_date || null,
        origin: origin || null,
        weight_g: weight_g ? parseInt(weight_g) : null,
        is_active: is_active !== undefined ? is_active : true,
        is_pre_ground: !!is_pre_ground,
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (err: any) {
    console.error('PUT /api/beans error:', err.message, err.stack)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
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

    // First, fetch the deleted bean's name/roaster so we can check for orphan cleanup
    const { data: deletedBean } = await userClient
      .from('beans')
      .select('name, roaster')
      .eq('id', id)
      .maybeSingle()

    const { error } = await userClient
      .from('beans')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clean up orphaned bean_journal entry if no other inventory beans or brews share this name+roaster
    if (deletedBean?.name && deletedBean?.roaster) {
      const nameKey = deletedBean.name.trim().toLowerCase()
      const roasterKey = deletedBean.roaster.trim().toLowerCase()

      const [{ count: remainingBeans }, { count: remainingBrews }] = await Promise.all([
        userClient
          .from('beans')
          .select('id', { count: 'exact', head: true })
          .ilike('name', deletedBean.name.trim())
          .ilike('roaster', deletedBean.roaster.trim()),
        userClient
          .from('brews')
          .select('id', { count: 'exact', head: true })
          .in(
            'bean_id',
            (await userClient.from('beans').select('id').ilike('name', deletedBean.name.trim()).ilike('roaster', deletedBean.roaster.trim())).data?.map((b: any) => b.id) ?? []
          ),
      ])

      if (!remainingBeans && !remainingBrews) {
        await userClient
          .from('bean_journal')
          .delete()
          .eq('user_id', user.id)
          .eq('name_key', nameKey)
          .eq('roaster_key', roasterKey)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
