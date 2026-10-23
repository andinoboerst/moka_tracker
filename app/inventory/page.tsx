'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import PageHeading from '@/components/PageHeading'
import BeanForm from '@/components/BeanForm'
import GrinderForm from '@/components/GrinderForm'
import MokaPotForm from '@/components/MokaPotForm'
import InventoryList from '@/components/InventoryList'
import MixManager from '@/components/MixManager'
import { Bean, BeanMix, Grinder, MokaPot } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

export default function InventoryPage() {
  const { t } = useLanguage()
  const [beans, setBeans] = useState<Bean[]>([])
  const [grinders, setGrinders] = useState<Grinder[]>([])
  const [mokaPots, setMokaPots] = useState<MokaPot[]>([])
  const [mixes, setMixes] = useState<BeanMix[]>([])
  const [loading, setLoading] = useState(true)

  // Edit states
  const [editingBean, setEditingBean] = useState<Bean | null>(null)
  const [editingGrinder, setEditingGrinder] = useState<Grinder | null>(null)
  const [editingMokaPot, setEditingMokaPot] = useState<MokaPot | null>(null)

  useEffect(() => {
    Promise.all([fetchBeans(), fetchGrinders(), fetchMokaPots(), fetchMixes()]).then(() =>
      setLoading(false)
    )
  }, [])

  const fetchBeans = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/beans', { headers })
      if (response.ok) {
        const data = await response.json()
        // Sort: active (true or undefined) first, then inactive (false)
        const sorted = data.sort((a: Bean, b: Bean) => {
          const aActive = a.is_active !== false
          const bActive = b.is_active !== false
          if (aActive === bActive) return 0
          return aActive ? -1 : 1
        })
        setBeans(sorted)
      }
    } catch (err) {
      console.error('Error fetching beans:', err)
    }
  }

  const fetchMixes = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/bean-mixes', { headers })
      if (response.ok) setMixes(await response.json())
    } catch (err) {
      console.error('Error fetching mixes:', err)
    }
  }

  const fetchGrinders = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/grinders', { headers })
      if (response.ok) {
        setGrinders(await response.json())
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
      }
    } catch (err) {
      console.error('Error fetching moka pots:', err)
    }
  }

  const handleSaveBean = async (bean: any) => {
    const headers = await getAuthHeaders()
    const method = bean.id ? 'PUT' : 'POST'
    const response = await fetch('/api/beans', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(bean),
    })
    if (response.ok) {
      await fetchBeans()
      setEditingBean(null)
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save bean`)
    }
  }

  const handleSaveGrinder = async (grinder: any) => {
    const headers = await getAuthHeaders()
    const method = grinder.id ? 'PUT' : 'POST'
    const response = await fetch('/api/grinders', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(grinder),
    })
    if (response.ok) {
      await fetchGrinders()
      setEditingGrinder(null)
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save grinder`)
    }
  }

  const handleSaveMokaPot = async (mokaPot: any) => {
    const headers = await getAuthHeaders()
    const method = mokaPot.id ? 'PUT' : 'POST'
    const response = await fetch('/api/moka-pots', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(mokaPot),
    })
    if (response.ok) {
      await fetchMokaPots()
      setEditingMokaPot(null)
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save moka pot`)
    }
  }

  const handleDeleteBean = async (id: string) => {
    if (!confirm(t('common.confirm_delete_item'))) return
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/beans?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    if (response.ok) await fetchBeans()
  }

  const handleDeleteGrinder = async (id: string) => {
    if (!confirm(t('common.confirm_delete_item'))) return
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/grinders?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    if (response.ok) await fetchGrinders()
  }

  const handleDeleteMokaPot = async (id: string) => {
    if (!confirm(t('common.confirm_delete_item'))) return
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/moka-pots?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    if (response.ok) await fetchMokaPots()
  }

  const handleToggleBeanActive = async (bean: Bean) => {
    try {
      const headers = await getAuthHeaders()
      const updatedBean = { ...bean, is_active: bean.is_active === false }
      const response = await fetch('/api/beans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(updatedBean),
      })
      if (response.ok) {
        await fetchBeans()
      }
    } catch (err) {
      console.error('Error toggling bean status:', err)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted">{t('inventory.loading')}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeading title={t('inventory.title')} subtitle={t('inventory.subtitle')} className="mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Forms */}
          <div className="space-y-6">
            <BeanForm
              onSubmit={handleSaveBean}
              isLoading={false}
              initialData={editingBean}
              onCancel={() => setEditingBean(null)}
            />
            <GrinderForm
              onSubmit={handleSaveGrinder}
              isLoading={false}
              initialData={editingGrinder}
              onCancel={() => setEditingGrinder(null)}
            />
            <MokaPotForm
              onSubmit={handleSaveMokaPot}
              isLoading={false}
              initialData={editingMokaPot}
              onCancel={() => setEditingMokaPot(null)}
            />
          </div>

          {/* Right column: Lists */}
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-serif font-bold text-accent mb-4">{t('inventory.your_beans')}</h2>
              <InventoryList
                items={beans}
                type="beans"
                onDelete={handleDeleteBean}
                onEdit={setEditingBean}
                onToggleActive={handleToggleBeanActive}
                isDeleting={false}
              />
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-accent mb-4">{t('feat.mixes_title')}</h2>
              <MixManager beans={beans} mixes={mixes} onChanged={fetchMixes} />
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-accent mb-4">{t('inventory.your_grinders')}</h2>
              <InventoryList
                items={grinders}
                type="grinders"
                onDelete={handleDeleteGrinder}
                onEdit={setEditingGrinder}
                isDeleting={false}
              />
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-accent mb-4">{t('inventory.your_moka_pots')}</h2>
              <InventoryList
                items={mokaPots}
                type="moka-pots"
                onDelete={handleDeleteMokaPot}
                onEdit={setEditingMokaPot}
                isDeleting={false}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
