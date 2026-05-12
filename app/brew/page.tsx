'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BrewForm from '@/components/BrewForm'
import { Bean, Grinder, MokaPot, BrewCreateInput } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function BrewPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [beans, setBeans] = useState<Bean[]>([])
  const [grinders, setGrinders] = useState<Grinder[]>([])
  const [mokaPots, setMokaPots] = useState<MokaPot[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetchBeans(), fetchGrinders(), fetchMokaPots()]).then(() =>
      setLoading(false)
    )
  }, [])

  const fetchBeans = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/beans', { headers })
      if (response.ok) setBeans(await response.json())
    } catch (err) {
      console.error('Error fetching beans:', err)
    }
  }

  const fetchGrinders = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/grinders', { headers })
      if (response.ok) setGrinders(await response.json())
    } catch (err) {
      console.error('Error fetching grinders:', err)
    }
  }

  const fetchMokaPots = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/moka-pots', { headers })
      if (response.ok) setMokaPots(await response.json())
    } catch (err) {
      console.error('Error fetching moka pots:', err)
    }
  }

  const handleSubmitBrew = async (brewData: BrewCreateInput) => {
    setIsSubmitting(true)
    try {
      const authHeaders = await getAuthHeaders()
      const response = await fetch('/api/brews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(brewData),
      })
      if (response.ok) {
        router.push('/')
      } else {
        const err = await response.json()
        throw new Error(err.error || 'Failed to save brew')
      }
    } catch (err) {
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#8b6f47]">{t('inventory.loading')}</p>
        </div>
      </>
    )
  }

  if (beans.length === 0 || mokaPots.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">
              {t('inventory.complete_inventory')}
            </h2>
            <p className="text-yellow-300 mb-4">
              {t('inventory.inventory_requirement')}
            </p>
            <Link
              href="/inventory"
              className="inline-block bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-6 rounded transition"
            >
              {t('inventory.go_to_inventory')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <BrewForm
          beans={beans}
          grinders={grinders}
          mokaPots={mokaPots}
          onSubmit={handleSubmitBrew}
          isLoading={isSubmitting}
        />
      </main>
    </>
  )
}
