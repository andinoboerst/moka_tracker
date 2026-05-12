import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 500 })
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: brew, error } = await supabaseAdmin
      .from('brews')
      .select(`
        *,
        bean:beans(id, name, origin, roast_level, roaster),
        grinder:grinders(id, brand, model, microns_per_click),
        moka_pot:moka_pots(id, brand, model, size_cups)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
    }

    return NextResponse.json(brew)
  } catch (err) {
    console.error('Error fetching brew:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
