'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import PageHeading from '@/components/PageHeading'
import BeanForm from '@/components/BeanForm'
import GrinderForm from '@/components/GrinderForm'
import MokaPotForm from '@/components/MokaPotForm'
import Modal from '@/components/Modal'
import { Plus } from 'lucide-react'
import InventoryList from '@/components/InventoryList'
import MixManager from '@/components/MixManager'
import { Bean, BeanMix, Grinder, MokaPot } from '@/lib/types'
import type { BeanFormPayload } from '@/components/BeanForm'
import type { GrinderFormPayload } from '@/components/GrinderForm'
import type { MokaPotFormPayload } from '@/components/MokaPotForm'
import { getAuthHeaders } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

export default function InventoryPage() {
  const { t } = useLanguage()
  const [beans, setBeans] = useState<Bean[]>([])
  const [grinders, setGrinders] = useState<Grinder[]>([])
  const [mokaPots, setMokaPots] = useState<MokaPot[]>([])
  const [mixes, setMixes] = useState<BeanMix[]>([])
  const [loading, setLoading] = useState(true)

  // The open add/edit dialog (item is set when editing)
  const [modal, setModal] = useState<
    | { type: 'bean'; item: Bean | null }
    | { type: 'gear'; item: MokaPot | null }
    | { type: 'grinder'; item: Grinder | null }
    | null
  >(null)
  const closeModal = useCallback(() => setModal(null), [])

  const [activeTab, setActiveTab] = useState<'beans' | 'gear' | 'grinders'>('beans')
  const tabs = [
    { id: 'beans' as const, label: t('inventory.your_beans'), count: beans.length },
    { id: 'gear' as const, label: t('inventory.brewing_gear'), count: mokaPots.length },
    { id: 'grinders' as const, label: t('inventory.your_grinders'), count: grinders.length },
  ]

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

  useEffect(() => {
    // Initial load on mount: the fetchers set state as part of loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([fetchBeans(), fetchGrinders(), fetchMokaPots(), fetchMixes()]).then(() =>
      setLoading(false)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveBean = async (bean: BeanFormPayload) => {
    const headers = await getAuthHeaders()
    const method = bean.id ? 'PUT' : 'POST'
    const response = await fetch('/api/beans', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(bean),
    })
    if (response.ok) {
      await fetchBeans()
      closeModal()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save bean`)
    }
  }

  const handleSaveGrinder = async (grinder: GrinderFormPayload) => {
    const headers = await getAuthHeaders()
    const method = grinder.id ? 'PUT' : 'POST'
    const response = await fetch('/api/grinders', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(grinder),
    })
    if (response.ok) {
      await fetchGrinders()
      closeModal()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save grinder`)
    }
  }

  const handleSaveMokaPot = async (mokaPot: MokaPotFormPayload) => {
    const headers = await getAuthHeaders()
    const method = mokaPot.id ? 'PUT' : 'POST'
    const response = await fetch('/api/moka-pots', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(mokaPot),
    })
    if (response.ok) {
      await fetchMokaPots()
      closeModal()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save brewing gear`)
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

        <div className="max-w-3xl mx-auto">
          <div role="tablist" className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                  activeTab === tab.id
                    ? 'border-accent text-accent-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {tab.label} <span className="num text-xs opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>

          <section role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'beans' && (
              <>
                <SectionHeader title={t('inventory.your_beans')} addLabel={t('inventory.add_bean')} onAdd={() => setModal({ type: 'bean', item: null })} />
                <InventoryList
                  items={beans}
                  type="beans"
                  onDelete={handleDeleteBean}
                  onEdit={(item) => setModal({ type: 'bean', item: item as Bean })}
                  onToggleActive={(item) => handleToggleBeanActive(item as Bean)}
                  isDeleting={false}
                />
                <div className="mt-8">
                  <h3 className="text-lg font-display font-bold text-accent-ink mb-3">{t('feat.mixes_title')}</h3>
                  <MixManager beans={beans} mixes={mixes} onChanged={fetchMixes} />
                </div>
              </>
            )}

            {activeTab === 'gear' && (
              <>
                <SectionHeader title={t('inventory.brewing_gear')} addLabel={t('inventory.add_gear')} onAdd={() => setModal({ type: 'gear', item: null })} />
                <InventoryList
                  items={mokaPots}
                  type="gear"
                  onDelete={handleDeleteMokaPot}
                  onEdit={(item) => setModal({ type: 'gear', item: item as MokaPot })}
                  isDeleting={false}
                />
              </>
            )}

            {activeTab === 'grinders' && (
              <>
                <SectionHeader title={t('inventory.your_grinders')} addLabel={t('inventory.add_grinder')} onAdd={() => setModal({ type: 'grinder', item: null })} />
                <InventoryList
                  items={grinders}
                  type="grinders"
                  onDelete={handleDeleteGrinder}
                  onEdit={(item) => setModal({ type: 'grinder', item: item as Grinder })}
                  isDeleting={false}
                />
              </>
            )}
          </section>
        </div>
      </main>

      {modal && (
        <Modal onClose={closeModal} label={t('inventory.add_item')}>
          {modal.type === 'bean' && (
            <BeanForm
              key={modal.item?.id ?? 'new-bean'}
              onSubmit={handleSaveBean}
              isLoading={false}
              initialData={modal.item}
              onCancel={closeModal}
            />
          )}
          {modal.type === 'gear' && (
            <MokaPotForm
              key={modal.item?.id ?? 'new-gear'}
              onSubmit={handleSaveMokaPot}
              isLoading={false}
              initialData={modal.item}
              onCancel={closeModal}
            />
          )}
          {modal.type === 'grinder' && (
            <GrinderForm
              key={modal.item?.id ?? 'new-grinder'}
              onSubmit={handleSaveGrinder}
              isLoading={false}
              initialData={modal.item}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </>
  )
}

function SectionHeader({ title, addLabel, onAdd }: { title: string; addLabel: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-display font-bold text-accent-ink">{title}</h2>
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title={addLabel}
        className="btn-primary h-9 w-9 !p-0 rounded-full flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}
