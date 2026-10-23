'use client'

import { useState } from 'react'
import { Edit2, Plus, Save, Trash2, X } from 'lucide-react'
import { Bean, BeanMix } from '@/lib/types'
import { getAuthHeaders } from '@/lib/utils'
import { mixArabicaShare } from '@/lib/beans'
import { useLanguage } from '@/lib/LanguageContext'

interface MixManagerProps {
  beans: Bean[]
  mixes: BeanMix[]
  onChanged: () => void
}

interface Row {
  bean_id: string
  percentage: string
}

const inputCls =
  'w-full bg-canvas border border-line-strong rounded-lg px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent'

export default function MixManager({ beans, mixes, onChanged }: MixManagerProps) {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rows, setRows] = useState<Row[]>([
    { bean_id: '', percentage: '70' },
    { bean_id: '', percentage: '30' },
  ])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const total = rows.reduce((sum, r) => sum + (parseInt(r.percentage) || 0), 0)

  const reset = () => {
    setEditingId(null)
    setOpen(false)
    setName('')
    setRows([
      { bean_id: '', percentage: '70' },
      { bean_id: '', percentage: '30' },
    ])
    setError('')
  }

  const startEdit = (mix: BeanMix) => {
    setEditingId(mix.id)
    setOpen(true)
    setName(mix.name)
    setRows(mix.components.map((c) => ({ bean_id: c.bean_id, percentage: String(c.percentage) })))
    setError('')
  }

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((current) => {
      const next = current.map((r, i) => (i === index ? { ...r, ...patch } : r))
      if (patch.percentage !== undefined && next.length === 2) {
        const value = Math.min(100, Math.max(0, parseInt(patch.percentage) || 0))
        next[1 - index] = { ...next[1 - index], percentage: String(100 - value) }
      }
      return next
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (total !== 100) {
      setError(t('feat.mix_must_100'))
      return
    }
    if (rows.some((r) => !r.bean_id) || new Set(rows.map((r) => r.bean_id)).size !== rows.length) {
      setError(t('feat.mix_need_two'))
      return
    }

    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/bean-mixes', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          id: editingId,
          name,
          components: rows.map((r) => ({ bean_id: r.bean_id, percentage: parseInt(r.percentage) })),
        }),
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save mix')
      reset()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mix')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('feat.mix_confirm_delete'))) return
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/bean-mixes?id=${id}`, { method: 'DELETE', headers })
    if (response.ok) onChanged()
  }

  const beanName = (id: string) => beans.find((b) => b.id === id)?.name ?? '?'

  return (
    <div className="space-y-3">
      {mixes.length === 0 && !open && <p className="text-sm text-muted">{t('feat.mixes_empty')}</p>}

      {mixes.map((mix) => {
        const share = mixArabicaShare(
          mix.components.map((c) => ({ percentage: c.percentage, bean: beans.find((b) => b.id === c.bean_id) }))
        )
        return (
          <div key={mix.id} className="bg-surface border border-line rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-medium text-ink">{mix.name}</h4>
              <p className="text-sm text-muted">
                {[...mix.components]
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((c) => `${c.percentage}% ${beanName(c.bean_id)}`)
                  .join(' + ')}
              </p>
              {share !== null && (
                <p className="text-[10px] text-muted mt-0.5">
                  {t('feat.mix_overall', { arabica: share, robusta: 100 - share })}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(mix)} className="p-2 hover:bg-line rounded text-accent" aria-label="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(mix.id)} className="p-2 hover:bg-red-900/30 rounded text-red-400" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}

      {open ? (
        <form onSubmit={handleSave} className="bg-surface border border-accent rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-accent">{editingId ? t('feat.mix_form_edit') : t('feat.mix_form_add')}</h4>
            <button type="button" onClick={reset} className="text-muted hover:text-ink" aria-label="Cancel">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('feat.mix_name_ph')}
            maxLength={100}
            required
            className={inputCls}
          />

          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={row.bean_id}
                onChange={(e) => updateRow(i, { bean_id: e.target.value })}
                required
                className={inputCls}
              >
                <option value="">{t('brew_form.select_bean')}</option>
                {beans.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.bean_type ? ` · ${b.bean_type}` : ''}
                  </option>
                ))}
              </select>
              <div className="relative w-28 shrink-0">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={row.percentage}
                  onChange={(e) => updateRow(i, { percentage: e.target.value })}
                  className={`${inputCls} pr-7`}
                  aria-label="%"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
              </div>
              {rows.length > 2 && (
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                  className="p-2 text-muted hover:text-red-400"
                  aria-label={t('feat.mix_remove')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            {rows.length < 4 ? (
              <button
                type="button"
                onClick={() => setRows((r) => [...r, { bean_id: '', percentage: '0' }])}
                className="text-xs text-muted hover:text-accent flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {t('feat.mix_add_bean')}
              </button>
            ) : (
              <span />
            )}
            <span className={`text-xs font-medium ${total === 100 ? 'text-green-400' : 'text-red-400'}`}>
              {t('feat.mix_total')}: {total}%
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-canvas font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>
      ) : (
        beans.length >= 2 && (
          <button
            onClick={() => setOpen(true)}
            className="w-full border border-dashed border-line-strong hover:border-accent text-muted hover:text-accent rounded-xl py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('feat.mix_form_add')}
          </button>
        )
      )}
    </div>
  )
}
