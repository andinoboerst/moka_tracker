'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import BrewForm from '@/components/BrewForm'
import { BrewCreateInput } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { useBrewInventory } from '@/lib/useInventory'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

function BrewPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { t, language } = useLanguage()
  const { beans, grinders, mokaPots, mixes, history, loading, reload } = useBrewInventory()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // "Brew again": /brew?from=<brew id> starts from an earlier brew's settings
  const fromId = params.get('from')
  const prefill = fromId ? history.find((b) => b.id === fromId) || null : null
  const waitingForPrefill = !!fromId && loading

  const handleSubmitBrew = async (brewData: BrewCreateInput) => {
    setIsSubmitting(true)
    try {
      const authHeaders = await getAuthHeaders()
      const response = await fetch('/api/brews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...brewData, language: language || 'en' }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to save brew')
      }
      router.push('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || waitingForPrefill) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted">{t('inventory.loading')}</p>
        </div>
      </>
    )
  }

  if (beans.length === 0 || mokaPots.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">{t('inventory.complete_inventory')}</h2>
            <p className="text-yellow-300 mb-4">{t('inventory.inventory_requirement')}</p>
            <Link
              href="/inventory"
              className="inline-block bg-accent hover:bg-accent-hover text-canvas font-semibold py-2 px-6 rounded-lg transition"
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
          key={prefill?.id || 'new'}
          beans={beans}
          grinders={grinders}
          mokaPots={mokaPots}
          mixes={mixes}
          history={history}
          prefill={prefill}
          onSubmit={handleSubmitBrew}
          isLoading={isSubmitting}
          onMixSaved={reload}
        />
      </main>
    </>
  )
}

export default function BrewPage() {
  return (
    <Suspense>
      <BrewPageContent />
    </Suspense>
  )
}
