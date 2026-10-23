'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import BrewForm from '@/components/BrewForm'
import { Brew, BrewCreateInput } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { useBrewInventory } from '@/lib/useInventory'
import { useLanguage } from '@/lib/LanguageContext'

export default function EditBrewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, language } = useLanguage()
  const { beans, grinders, mokaPots, mixes, loading, reload } = useBrewInventory()
  const [brew, setBrew] = useState<Brew | null>(null)
  const [brewLoading, setBrewLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/brews/${id}`, { headers })
        if (response.ok) setBrew(await response.json())
      } finally {
        setBrewLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (data: BrewCreateInput) => {
    setIsSubmitting(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/brews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ ...data, id, language }),
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update brew')
      router.push('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || brewLoading) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted">{t('inventory.loading')}</p>
        </div>
      </>
    )
  }

  if (!brew) {
    return (
      <>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <h1 className="text-3xl font-serif font-bold text-ink">{t('brew_share_page.not_found')}</h1>
          <Link href="/" className="text-accent hover:underline">
            {t('brew_share_page.back_to_brews')}
          </Link>
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
          mixes={mixes}
          initialBrew={brew}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          onMixSaved={reload}
        />
      </main>
    </>
  )
}
