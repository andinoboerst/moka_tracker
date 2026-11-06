'use client'

import { useLanguage } from '@/lib/LanguageContext'

export type KindFilter = '' | 'moka' | 'espresso'

/** All / Moka / Espresso switch used on the dashboard and analytics. */
export default function BrewerKindToggle({ value, onChange }: { value: KindFilter; onChange: (kind: KindFilter) => void }) {
  const { t } = useLanguage()
  const options: { id: KindFilter; label: string }[] = [
    { id: '', label: t('dashboard.kind_all') },
    { id: 'moka', label: t('dashboard.kind_moka') },
    { id: 'espresso', label: t('dashboard.kind_espresso') },
  ]
  return (
    <div className="segmented w-max" role="radiogroup" aria-label={t('moka_form.kind')}>
      {options.map(({ id, label }) => (
        <button
          key={id || 'all'}
          type="button"
          role="radio"
          aria-checked={value === id}
          data-active={value === id}
          onClick={() => onChange(id)}
          className="segmented-item whitespace-nowrap"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
