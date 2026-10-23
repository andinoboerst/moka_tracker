'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Bean, BeanMix, Brew, Grinder, MokaPot, BrewCreateInput } from '@/lib/types'
import { calculateBrewRatio, calculateExtractionRatio, mokaPotName, getAuthHeaders, formatDate } from '@/lib/utils'
import { mixArabicaShare, mixSignature } from '@/lib/beans'
import { X, Plus, Play, Square, RotateCcw, History, Save, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface BrewFormProps {
  beans: Bean[]
  grinders: Grinder[]
  mokaPots: MokaPot[]
  mixes?: BeanMix[]
  /** Past brews, used to offer "use settings from last similar brew" */
  history?: Brew[]
  /** Editing an existing brew */
  initialBrew?: Brew | null
  /** Start a new brew from an earlier one ("brew again") */
  prefill?: Brew | null
  onSubmit: (brew: BrewCreateInput) => Promise<void>
  isLoading: boolean
  onMixSaved?: () => void
}

interface MixRow {
  bean_id: string
  percentage: string
}

const inputCls =
  'w-full bg-canvas border border-line-strong rounded-lg px-3 py-2 text-ink placeholder-muted focus:outline-none focus:border-accent'
const labelCls = 'block text-sm font-medium text-ink mb-1'

const emptyForm = {
  bean_id: '',
  grinder_id: '',
  moka_pot_id: '',
  grinder_setting: '',
  coffee_weight_g: '',
  water_added_g: '',
  final_yield_g: '',
  extraction_time_s: '',
  milk_added_g: '',
  milk_type: 'Whole Milk',
  vibe_rating: '7',
  tasting_notes: '',
  water_temp: 'Boiling',
  heat_level: 'Medium-Low',
  has_paper_filter: false,
  flow_type: 'Steady',
}

type FormState = typeof emptyForm

function formFromBrew(brew: Brew, keepResult: boolean): FormState {
  return {
    bean_id: brew.bean_id,
    grinder_id: brew.grinder_id || '',
    moka_pot_id: brew.moka_pot_id,
    grinder_setting: brew.grinder_setting?.toString() ?? '',
    coffee_weight_g: brew.coffee_weight_g.toString(),
    water_added_g: brew.water_added_g.toString(),
    final_yield_g: keepResult ? brew.final_yield_g.toString() : '',
    extraction_time_s: keepResult ? brew.extraction_time_s.toString() : '',
    milk_added_g: brew.milk_added_g?.toString() ?? '',
    milk_type: brew.milk_type || 'Whole Milk',
    vibe_rating: keepResult ? brew.vibe_rating.toString() : '7',
    tasting_notes: keepResult ? brew.tasting_notes || '' : '',
    water_temp: brew.water_temp || 'Boiling',
    heat_level: brew.heat_level || 'Medium-Low',
    has_paper_filter: !!brew.has_paper_filter,
    flow_type: brew.flow_type || 'Steady',
  }
}

export default function BrewForm({
  beans,
  grinders,
  mokaPots,
  mixes = [],
  history = [],
  initialBrew,
  prefill,
  onSubmit,
  isLoading,
  onMixSaved,
}: BrewFormProps) {
  const { t } = useLanguage()
  const source = initialBrew || prefill || null
  const isEdit = !!initialBrew

  const [formData, setFormData] = useState<FormState>(() => (source ? formFromBrew(source, isEdit) : emptyForm))
  const [mixRows, setMixRows] = useState<MixRow[]>(() =>
    source?.mix && source.mix.length > 1
      ? source.mix.map((c) => ({ bean_id: c.bean_id, percentage: c.percentage.toString() }))
      : []
  )
  const [useMix, setUseMix] = useState(() => !!(source?.mix && source.mix.length > 1))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Stopwatch for extraction time
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const startedAt = useRef<number>(0)

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setTimerSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250)
    return () => clearInterval(id)
  }, [timerRunning])

  const toggleTimer = () => {
    if (timerRunning) {
      setTimerRunning(false)
      setFormData((prev) => ({ ...prev, extraction_time_s: String(timerSeconds) }))
    } else {
      startedAt.current = Date.now() - timerSeconds * 1000
      setTimerRunning(true)
    }
  }
  const resetTimer = () => {
    setTimerRunning(false)
    setTimerSeconds(0)
  }

  const activeBeans = useMemo(
    () => beans.filter((b) => b.is_active !== false || b.id === formData.bean_id || mixRows.some((r) => r.bean_id === b.id)),
    [beans, formData.bean_id, mixRows]
  )

  // Defaults for a brand-new brew once inventory is loaded
  useEffect(() => {
    if (source) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => ({
      ...prev,
      bean_id: prev.bean_id || (beans.find((b) => b.is_active !== false)?.id ?? ''),
      grinder_id: prev.grinder_id || (grinders[0]?.id ?? ''),
      moka_pot_id: prev.moka_pot_id || (mokaPots[0]?.id ?? ''),
    }))
  }, [beans, grinders, mokaPots, source])

  const selectedBeanIds = useMix ? mixRows.map((r) => r.bean_id).filter(Boolean) : [formData.bean_id].filter(Boolean)
  const selectedBeans = selectedBeanIds.map((id) => beans.find((b) => b.id === id)).filter(Boolean) as Bean[]
  const isPreGround = selectedBeans.length > 0 && selectedBeans.every((b) => b.is_pre_ground === true)

  // Grinder is cleared for pre-ground coffee and re-selected when switching back
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => {
      if (isPreGround && prev.grinder_id) return { ...prev, grinder_id: '', grinder_setting: '' }
      if (!isPreGround && !prev.grinder_id && grinders[0]) return { ...prev, grinder_id: grinders[0].id }
      return prev
    })
  }, [isPreGround, grinders])

  const mixTotal = mixRows.reduce((sum, r) => sum + (parseInt(r.percentage) || 0), 0)
  const mixValid = !useMix || (mixRows.length >= 2 && mixTotal === 100 && new Set(mixRows.map((r) => r.bean_id)).size === mixRows.length && mixRows.every((r) => r.bean_id))

  const mixShare = useMemo(() => {
    if (!useMix) return null
    return mixArabicaShare(
      mixRows.map((r) => ({ percentage: parseInt(r.percentage) || 0, bean: beans.find((b) => b.id === r.bean_id) }))
    )
  }, [useMix, mixRows, beans])

  const enableMix = (enabled: boolean) => {
    setUseMix(enabled)
    if (enabled && mixRows.length < 2) {
      const first = formData.bean_id || beans[0]?.id || ''
      const second = beans.find((b) => b.id !== first && b.is_active !== false)?.id || ''
      setMixRows([
        { bean_id: first, percentage: '70' },
        { bean_id: second, percentage: '30' },
      ])
    }
  }

  const updateRow = (index: number, patch: Partial<MixRow>) => {
    setMixRows((rows) => {
      const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
      // With exactly two beans, keep the second one as the remainder
      if (patch.percentage !== undefined && next.length === 2) {
        const value = Math.min(100, Math.max(0, parseInt(patch.percentage) || 0))
        next[1 - index] = { ...next[1 - index], percentage: String(100 - value) }
      }
      return next
    })
  }

  const applySavedMix = (id: string) => {
    const mix = mixes.find((m) => m.id === id)
    if (!mix) return
    setMixRows(
      mix.components
        .filter((c) => beans.some((b) => b.id === c.bean_id))
        .map((c) => ({ bean_id: c.bean_id, percentage: String(c.percentage) }))
    )
  }

  const saveCurrentMix = async () => {
    const name = window.prompt(t('feat.mix_name_prompt'))
    if (!name?.trim()) return
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/bean-mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          name,
          components: mixRows.map((r) => ({ bean_id: r.bean_id, percentage: parseInt(r.percentage) })),
        }),
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save mix')
      setNotice(t('feat.mix_saved_ok'))
      onMixSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mix')
    }
  }

  // Most recent earlier brew with the same beans and pot
  const similarBrew = useMemo(() => {
    if (isEdit) return null
    const signature = useMix
      ? mixRows.map((r) => `${r.bean_id}:${parseInt(r.percentage) || 0}`).sort().join('|')
      : formData.bean_id
    return (
      history.find(
        (b) =>
          b.moka_pot_id === formData.moka_pot_id &&
          mixSignature({ bean_id: b.bean_id, mix: b.mix }) === signature
      ) || null
    )
  }, [history, formData.bean_id, formData.moka_pot_id, useMix, mixRows, isEdit])

  const applySimilar = () => {
    if (!similarBrew) return
    const next = formFromBrew(similarBrew, false)
    setFormData((prev) => ({ ...next, bean_id: prev.bean_id, moka_pot_id: prev.moka_pot_id }))
    setNotice(t('feat.used_last', { date: formatDate(similarBrew.created_at) }))
  }

  const brewRatio = useMemo(() => {
    const c = parseFloat(formData.coffee_weight_g)
    const w = parseFloat(formData.water_added_g)
    return c > 0 && w > 0 ? calculateBrewRatio(c, w) : 0
  }, [formData.coffee_weight_g, formData.water_added_g])

  const extractionRatio = useMemo(() => {
    const c = parseFloat(formData.coffee_weight_g)
    const y = parseFloat(formData.final_yield_g)
    return c > 0 && y > 0 ? calculateExtractionRatio(c, y) : 0
  }, [formData.coffee_weight_g, formData.final_yield_g])

  // Stock warning: coffee needed per bag vs what is left
  const stockWarning = useMemo(() => {
    const coffee = parseFloat(formData.coffee_weight_g)
    if (!(coffee > 0)) return null
    const parts = useMix
      ? mixRows.map((r) => ({ id: r.bean_id, grams: (coffee * (parseInt(r.percentage) || 0)) / 100 }))
      : [{ id: formData.bean_id, grams: coffee }]
    for (const part of parts) {
      const bean = beans.find((b) => b.id === part.id)
      if (bean && typeof bean.weight_g === 'number' && part.grams > bean.weight_g) {
        return t('feat.stock_warn', { name: bean.name, grams: bean.weight_g })
      }
    }
    return null
  }, [formData.coffee_weight_g, formData.bean_id, useMix, mixRows, beans, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!mixValid) {
      setError(t('feat.mix_must_100'))
      return
    }

    try {
      const mix = useMix ? mixRows.map((r) => ({ bean_id: r.bean_id, percentage: parseInt(r.percentage) })) : undefined
      await onSubmit({
        bean_id: useMix ? mix![0].bean_id : formData.bean_id,
        mix,
        grinder_id: formData.grinder_id || undefined,
        moka_pot_id: formData.moka_pot_id,
        grinder_setting: formData.grinder_id && formData.grinder_setting !== '' ? parseInt(formData.grinder_setting) : undefined,
        coffee_weight_g: parseFloat(formData.coffee_weight_g),
        water_added_g: parseFloat(formData.water_added_g),
        final_yield_g: parseFloat(formData.final_yield_g),
        extraction_time_s: parseInt(formData.extraction_time_s),
        milk_added_g: formData.milk_added_g ? parseFloat(formData.milk_added_g) : undefined,
        milk_type: formData.milk_added_g ? formData.milk_type : undefined,
        vibe_rating: parseInt(formData.vibe_rating),
        tasting_notes: formData.tasting_notes,
        water_temp: formData.water_temp,
        heat_level: formData.heat_level,
        has_paper_filter: formData.has_paper_filter,
        flow_type: formData.flow_type,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brew')
    }
  }

  const rating = parseInt(formData.vibe_rating)
  const vibeEmoji = rating <= 2 ? '🫠' : rating <= 4 ? '🤷‍♂️' : rating <= 6 ? '☕' : rating <= 8 ? '🇮🇹' : '🤌'
  const vibeName =
    rating <= 2
      ? t('dashboard.vibe_low')
      : rating <= 4
        ? t('dashboard.vibe_med_low')
        : rating <= 6
          ? t('dashboard.vibe_med')
          : rating <= 8
            ? t('dashboard.vibe_high')
            : t('dashboard.vibe_max')

  const beanLabel = (b: Bean) => `${b.name}${b.bean_type ? ` · ${b.bean_type}` : ''} (${b.roast_level})`
  const set = (patch: Partial<FormState>) => setFormData((prev) => ({ ...prev, ...patch }))

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl shadow-lg shadow-black/20 p-6 space-y-6">
      <h2 className="text-3xl font-serif font-bold text-accent">
        {isEdit ? t('feat.edit_brew') : t('brew_form.title')}
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-2 rounded-lg flex items-center justify-between" role="alert">
          <span>{error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}
      {notice && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setNotice('')} />
        </div>
      )}

      {/* Beans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-lg font-serif font-bold text-accent">{t('brew_form.bean')}</h3>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={useMix}
              onChange={(e) => enableMix(e.target.checked)}
              className="w-4 h-4 rounded border-line-strong bg-canvas accent-[var(--accent)]"
            />
            {t('feat.mix_toggle')}
          </label>
        </div>

        {!useMix ? (
          <select
            value={formData.bean_id}
            onChange={(e) => set({ bean_id: e.target.value })}
            required
            className={inputCls}
          >
            <option value="">{t('brew_form.select_bean')}</option>
            {activeBeans.map((bean) => (
              <option key={bean.id} value={bean.id}>
                {beanLabel(bean)}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl border border-line bg-canvas/50 p-4 space-y-3">
            <p className="text-xs text-muted">{t('feat.mix_hint')}</p>

            {mixes.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  applySavedMix(e.target.value)
                  e.target.value = ''
                }}
                className={inputCls}
                aria-label={t('feat.mix_saved')}
              >
                <option value="">{t('feat.mix_none')}</option>
                {mixes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {mixRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.bean_id}
                  onChange={(e) => updateRow(i, { bean_id: e.target.value })}
                  required
                  className={inputCls}
                >
                  <option value="">{t('brew_form.select_bean')}</option>
                  {activeBeans.map((bean) => (
                    <option key={bean.id} value={bean.id}>
                      {beanLabel(bean)}
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
                {mixRows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setMixRows((rows) => rows.filter((_, idx) => idx !== i))}
                    className="p-2 text-muted hover:text-red-400"
                    aria-label={t('feat.mix_remove')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {mixRows.length === 2 &&
                [50, 60, 70, 80].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateRow(0, { percentage: String(p) })}
                    className="px-2.5 py-1 rounded-full text-xs border border-line-strong text-muted hover:text-accent hover:border-accent"
                  >
                    {p}/{100 - p}
                  </button>
                ))}
              {mixRows.length >= 2 && mixRows.length < 4 && (
                <button
                  type="button"
                  onClick={() => setMixRows((rows) => [...rows, { bean_id: '', percentage: '0' }])}
                  className="px-2.5 py-1 rounded-full text-xs border border-line-strong text-muted hover:text-accent hover:border-accent flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {t('feat.mix_add_bean')}
                </button>
              )}
              {mixValid && (
                <button
                  type="button"
                  onClick={saveCurrentMix}
                  className="px-2.5 py-1 rounded-full text-xs border border-line-strong text-muted hover:text-accent hover:border-accent flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> {t('feat.mix_save')}
                </button>
              )}
              <span className={`ml-auto text-xs font-medium ${mixTotal === 100 ? 'text-green-400' : 'text-red-400'}`}>
                {t('feat.mix_total')}: {mixTotal}%
              </span>
            </div>

            {mixShare !== null && mixTotal === 100 && (
              <p className="text-xs text-muted">
                {t('feat.mix_overall', { arabica: mixShare, robusta: 100 - mixShare })}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isPreGround && (
            <div>
              <label className={labelCls}>{t('brew_form.grinder')}</label>
              <select
                value={formData.grinder_id}
                onChange={(e) => set({ grinder_id: e.target.value })}
                className={inputCls}
              >
                <option value="">{t('brew_form.pre_ground')}</option>
                {grinders.map((grinder) => (
                  <option key={grinder.id} value={grinder.id}>
                    {grinder.brand} {grinder.model}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>{t('brew_form.moka_pot')}</label>
            <select
              value={formData.moka_pot_id}
              onChange={(e) => set({ moka_pot_id: e.target.value })}
              required
              className={inputCls}
            >
              <option value="">{t('brew_form.select_moka')}</option>
              {mokaPots.map((pot) => (
                <option key={pot.id} value={pot.id}>
                  {mokaPotName(pot)} ({t('moka_form.cup_count', { count: pot.size_cups })})
                </option>
              ))}
            </select>
          </div>
        </div>

        {similarBrew && (
          <button
            type="button"
            onClick={applySimilar}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
          >
            <History className="w-4 h-4" /> {t('feat.use_last')}
          </button>
        )}
      </section>

      {/* Brew Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.grinder_id && !isPreGround && (
          <div>
            <label className={labelCls}>{t('brew_form.grinder_setting')}</label>
            <input
              type="number"
              value={formData.grinder_setting}
              onChange={(e) => set({ grinder_setting: e.target.value })}
              placeholder="e.g., 15"
              required
              min="0"
              className={inputCls}
            />
          </div>
        )}

        <div>
          <label className={labelCls}>{t('brew_form.coffee_weight')}</label>
          <input
            type="number"
            value={formData.coffee_weight_g}
            onChange={(e) => set({ coffee_weight_g: e.target.value })}
            placeholder="e.g., 18"
            required
            min="0"
            step="0.1"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('brew_form.water_added')}</label>
          <input
            type="number"
            value={formData.water_added_g}
            onChange={(e) => set({ water_added_g: e.target.value })}
            placeholder="e.g., 36"
            required
            min="0"
            step="0.1"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('brew_form.final_yield')}</label>
          <input
            type="number"
            value={formData.final_yield_g}
            onChange={(e) => set({ final_yield_g: e.target.value })}
            placeholder="e.g., 32"
            required
            min="0"
            step="0.1"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t('brew_form.extraction_time')}</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={timerRunning ? timerSeconds : formData.extraction_time_s}
              onChange={(e) => set({ extraction_time_s: e.target.value })}
              readOnly={timerRunning}
              placeholder="e.g., 45"
              required
              min="0"
              className={inputCls}
            />
            <button
              type="button"
              onClick={toggleTimer}
              className={`shrink-0 px-3 rounded-lg border flex items-center gap-1.5 text-sm font-medium ${
                timerRunning ? 'border-red-500 text-red-400' : 'border-line-strong text-accent hover:border-accent'
              }`}
              title={timerRunning ? t('feat.timer_stop') : t('feat.timer_start')}
            >
              {timerRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{timerRunning ? t('feat.timer_stop') : t('feat.timer_start')}</span>
            </button>
            {!timerRunning && timerSeconds > 0 && (
              <button
                type="button"
                onClick={resetTimer}
                className="shrink-0 px-2 text-muted hover:text-accent"
                title={t('feat.timer_reset')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            {t('brew_form.milk_added')} - <span className="text-muted font-normal italic">{t('brew_form.milk_hint')}</span>
          </label>
          <input
            type="number"
            value={formData.milk_added_g}
            onChange={(e) => set({ milk_added_g: e.target.value })}
            placeholder="e.g., 50"
            min="0"
            step="0.1"
            className={inputCls}
          />
        </div>

        {parseFloat(formData.milk_added_g) > 0 && (
          <div>
            <label className={labelCls}>{t('brew_form.milk_type')}</label>
            <select value={formData.milk_type} onChange={(e) => set({ milk_type: e.target.value })} className={inputCls}>
              <option value="Whole Milk">{t('brew_form.whole_milk') || 'Whole Milk'}</option>
              <option value="Semi-skimmed">{t('brew_form.semi_skimmed') || 'Semi-skimmed'}</option>
              <option value="Skimmed">{t('brew_form.skimmed') || 'Skimmed'}</option>
              <option value="Oat Milk">{t('brew_form.oat_milk') || 'Oat Milk'}</option>
              <option value="Almond Milk">{t('brew_form.almond_milk') || 'Almond Milk'}</option>
              <option value="Soy Milk">{t('brew_form.soy_milk') || 'Soy Milk'}</option>
              <option value="Coconut Milk">{t('brew_form.coconut_milk') || 'Coconut Milk'}</option>
              <option value="Cashew Milk">{t('brew_form.cashew_milk') || 'Cashew Milk'}</option>
              <option value="Pea Milk">{t('brew_form.pea_milk') || 'Pea Milk'}</option>
              <option value="Other">{t('common.none') || 'Other'}</option>
            </select>
          </div>
        )}
      </div>

      {stockWarning && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {stockWarning}
        </div>
      )}

      {/* Expert Variables */}
      <div className="p-6 bg-canvas/50 border border-line rounded-xl space-y-6">
        <h3 className="text-lg font-serif font-bold text-accent flex items-center gap-2">
          <span className="text-xl">🔬</span> {t('brew_form.expert_variables')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t('brew_form.water_temp')}</label>
            <select value={formData.water_temp} onChange={(e) => set({ water_temp: e.target.value })} className={inputCls}>
              <option value="Boiling">{t('brew_form.temp_boiling')}</option>
              <option value="Warm">{t('brew_form.temp_warm')}</option>
              <option value="Cold">{t('brew_form.temp_cold')}</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>{t('brew_form.heat_intensity')}</label>
            <select value={formData.heat_level} onChange={(e) => set({ heat_level: e.target.value })} className={inputCls}>
              <option value="Low">{t('brew_form.heat_low')}</option>
              <option value="Medium-Low">{t('brew_form.heat_med_low')}</option>
              <option value="Medium">{t('brew_form.heat_med')}</option>
              <option value="High">{t('brew_form.heat_high')}</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>{t('brew_form.flow_observation')}</label>
            <select value={formData.flow_type} onChange={(e) => set({ flow_type: e.target.value })} className={inputCls}>
              <option value="Honey-like">{t('brew_form.flow_honey')}</option>
              <option value="Steady">{t('brew_form.flow_steady')}</option>
              <option value="Sputtering">{t('brew_form.flow_sputtering')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="has_paper_filter"
              checked={formData.has_paper_filter}
              onChange={(e) => set({ has_paper_filter: e.target.checked })}
              className="w-4 h-4 rounded border-line-strong bg-canvas accent-[var(--accent)]"
            />
            <label htmlFor="has_paper_filter" className="text-sm font-medium text-ink">
              {t('brew_form.paper_filter')}
            </label>
          </div>
        </div>
      </div>

      {/* Auto-Calculated Ratios */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-line rounded-xl border border-line-strong">
        <div>
          <p className="text-sm text-muted mb-1">{t('brew_form.brew_ratio')}</p>
          <p className="text-lg font-semibold text-accent">{brewRatio ? `1:${brewRatio.toFixed(2)}` : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted mb-1">{t('brew_form.extraction_ratio')}</p>
          <p className="text-lg font-semibold text-accent">{extractionRatio ? `1:${extractionRatio.toFixed(2)}` : '—'}</p>
        </div>
      </div>

      {/* Rating and Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            {t('brew_form.vibe_rating')}: {formData.vibe_rating}/10 — {vibeName} {vibeEmoji}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.vibe_rating}
            onChange={(e) => set({ vibe_rating: e.target.value })}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div>
          <label className={labelCls}>{t('brew_form.tasting_notes')}</label>
          <textarea
            value={formData.tasting_notes}
            onChange={(e) => set({ tasting_notes: e.target.value })}
            placeholder={t('brew_form.tasting_hint')}
            rows={3}
            className={inputCls}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !mixValid}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-canvas font-semibold py-3 rounded-xl transition text-lg"
      >
        {isLoading ? t('common.saving') : isEdit ? t('feat.save_changes') : t('brew_form.save_button')}
      </button>
    </form>
  )
}
