'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bean, BeanMix, Brew, Grinder, MokaPot } from './types'
import { getAuthHeaders } from './utils'

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(url, { headers })
    return response.ok ? ((await response.json()) as T) : fallback
  } catch (err) {
    console.error(`Error fetching ${url}:`, err)
    return fallback
  }
}

/** Loads the user's beans, grinders, pots, saved mixes and recent brews for the brew form. */
export function useBrewInventory() {
  const [beans, setBeans] = useState<Bean[]>([])
  const [grinders, setGrinders] = useState<Grinder[]>([])
  const [mokaPots, setMokaPots] = useState<MokaPot[]>([])
  const [mixes, setMixes] = useState<BeanMix[]>([])
  const [history, setHistory] = useState<Brew[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [b, g, m, mx, h] = await Promise.all([
      getJson<Bean[]>('/api/beans', []),
      getJson<Grinder[]>('/api/grinders', []),
      getJson<MokaPot[]>('/api/moka-pots', []),
      getJson<BeanMix[]>('/api/bean-mixes', []),
      getJson<{ data: Brew[] }>('/api/brews?pageSize=100', { data: [] }),
    ])
    setBeans(b)
    setGrinders(g)
    setMokaPots(m)
    setMixes(mx)
    setHistory(h.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  return { beans, grinders, mokaPots, mixes, history, loading, reload }
}
