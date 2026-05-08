'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import BeanForm from '@/components/BeanForm'
import GrinderForm from '@/components/GrinderForm'
import MokaPotForm from '@/components/MokaPotForm'
import InventoryList from '@/components/InventoryList'
import { Bean, Grinder, MokaPot } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'

export default function InventoryPage() {
  const [beans, setBeans] = useState<Bean[]>([])
  const [grinders, setGrinders] = useState<Grinder[]>([])
  const [mokaPots, setMokaPots] = useState<MokaPot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchBeans(), fetchGrinders(), fetchMokaPots()]).then(() =>
      setLoading(false)
    )
  }, [])

  const fetchBeans = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/beans', { headers })
      if (response.ok) {
        setBeans(await response.json())
      } else {
        console.error('Beans fetch failed:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Error fetching beans:', err)
    }
  }

  const fetchGrinders = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/grinders', { headers })
      if (response.ok) {
        setGrinders(await response.json())
      } else {
        console.error('Grinders fetch failed:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Error fetching grinders:', err)
    }
  }

  const fetchMokaPots = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/moka-pots', { headers })
      if (response.ok) {
        setMokaPots(await response.json())
      } else {
        console.error('Moka pots fetch failed:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Error fetching moka pots:', err)
    }
  }

  const handleAddBean = async (bean: any) => {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(bean),
    })
    if (response.ok) {
      await fetchBeans()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to add bean: ${response.status}`)
    }
  }

  const handleAddGrinder = async (grinder: any) => {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/grinders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(grinder),
    })
    if (response.ok) {
      await fetchGrinders()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to add grinder: ${response.status}`)
    }
  }

  const handleAddMokaPot = async (mokaPot: any) => {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/moka-pots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(mokaPot),
    })
    if (response.ok) {
      await fetchMokaPots()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to add moka pot: ${response.status}`)
    }
  }

  const handleDeleteBean = async (id: string) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/beans?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    if (response.ok) await fetchBeans()
  }

  const handleDeleteGrinder = async (id: string) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/grinders?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    if (response.ok) await fetchGrinders()
  }

  const handleDeleteMokaPot = async (id: string) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/moka-pots?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    if (response.ok) await fetchMokaPots()
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#8b6f47]">Loading inventory...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#d4a574] mb-2">
            Inventory Management
          </h1>
          <p className="text-[#8b6f47] text-lg">
            Build your coffee equipment collection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Forms */}
          <div className="space-y-6">
            <BeanForm onSubmit={handleAddBean} isLoading={false} />
            <GrinderForm onSubmit={handleAddGrinder} isLoading={false} />
            <MokaPotForm onSubmit={handleAddMokaPot} isLoading={false} />
          </div>

          {/* Right column: Lists */}
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-[#d4a574] mb-4">Your Beans</h2>
              <InventoryList
                items={beans}
                type="beans"
                onDelete={handleDeleteBean}
                isDeleting={false}
              />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#d4a574] mb-4">Your Grinders</h2>
              <InventoryList
                items={grinders}
                type="grinders"
                onDelete={handleDeleteGrinder}
                isDeleting={false}
              />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#d4a574] mb-4">Your Moka Pots</h2>
              <InventoryList
                items={mokaPots}
                type="moka-pots"
                onDelete={handleDeleteMokaPot}
                isDeleting={false}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
