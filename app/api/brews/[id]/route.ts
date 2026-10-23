import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/serverAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getAuthedContext(request)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: brew, error } = await ctx.client
      .from('brews')
      .select('*, bean:beans(*), grinder:grinders(*), moka_pot:moka_pots(*)')
      .eq('id', id)
      .maybeSingle()

    if (error || !brew) return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
    return NextResponse.json(brew)
  } catch (err) {
    console.error('Error fetching brew:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
