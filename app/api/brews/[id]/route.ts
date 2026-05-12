import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: brew, error } = await supabase
      .from('brews')
      .select(`
        *,
        bean:beans(id, name, origin, roast_level, roaster),
        grinder:grinders(id, brand, model, microns_per_click),
        moka_pot:moka_pots(id, brand, model, size_cups)
      `)
      .eq('id', params.id)
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
