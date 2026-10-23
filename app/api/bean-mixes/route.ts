import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/serverAuth'

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

type Component = { bean_id: string; percentage: number }

/** Validates a recipe: 2+ distinct beans, whole percentages summing to 100. */
function parseComponents(raw: unknown): Component[] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null
  const parsed = raw.map((c) => ({ bean_id: String(c?.bean_id || ''), percentage: Math.round(Number(c?.percentage)) }))
  const ids = new Set(parsed.map((c) => c.bean_id))
  if (ids.size !== parsed.length || ids.has('')) return null
  if (parsed.some((c) => !Number.isFinite(c.percentage) || c.percentage < 1 || c.percentage > 99)) return null
  if (parsed.reduce((sum, c) => sum + c.percentage, 0) !== 100) return null
  return parsed
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthedContext(request)
  if (!ctx) return unauthorized()
  const { data, error } = await ctx.client.from('bean_mixes').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthedContext(request)
  if (!ctx) return unauthorized()

  const body = await request.json()
  const name = String(body.name || '').trim().slice(0, 100)
  const components = parseComponents(body.components)
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!components) {
    return NextResponse.json({ error: 'A mix needs at least 2 different beans adding up to 100%' }, { status: 400 })
  }

  const { data, error } = await ctx.client
    .from('bean_mixes')
    .insert([{ user_id: ctx.user.id, name, components }])
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0], { status: 201 })
}

export async function PUT(request: NextRequest) {
  const ctx = await getAuthedContext(request)
  if (!ctx) return unauthorized()

  const body = await request.json()
  const name = String(body.name || '').trim().slice(0, 100)
  const components = parseComponents(body.components)
  if (!body.id || !name || !components) {
    return NextResponse.json({ error: 'A mix needs a name and at least 2 different beans adding up to 100%' }, { status: 400 })
  }

  const { data, error } = await ctx.client
    .from('bean_mixes')
    .update({ name, components, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthedContext(request)
  if (!ctx) return unauthorized()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const { error } = await ctx.client.from('bean_mixes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
