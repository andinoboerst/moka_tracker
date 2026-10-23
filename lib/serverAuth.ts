import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export interface AuthedContext {
  user: User
  token: string
  client: SupabaseClient
}

/** Verifies the bearer token and returns a Supabase client that acts as that user (RLS applies). */
export async function getAuthedContext(request: NextRequest): Promise<AuthedContext | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const {
    data: { user },
  } = await client.auth.getUser(token)

  if (!user) return null
  return { user, token, client }
}

/** Runs a ranged query repeatedly to get past PostgREST's per-request row cap. */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  chunk = 1000
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += chunk) {
    const { data, error } = await build(from, from + chunk - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < chunk) break
  }
  return rows
}
