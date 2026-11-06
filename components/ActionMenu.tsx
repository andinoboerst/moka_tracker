'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Ellipsis, type LucideIcon } from 'lucide-react'

export interface ActionMenuItem {
  label: string
  icon: LucideIcon
  /** Navigates instead of running onClick */
  href?: string
  onClick?: () => void
  /** Red, and set apart from the other actions */
  danger?: boolean
  disabled?: boolean
}

/** A single "more" button that opens a small list of actions. Closes on outside click, Escape or choosing an item. */
export default function ActionMenu({ items, label }: { items: ActionMenuItem[]; label: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const itemCls = (item: ActionMenuItem) =>
    `flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm transition disabled:opacity-50 ${
      item.danger ? 'text-red-400 hover:bg-red-900/30' : 'text-ink hover:bg-line'
    }`

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`p-2 rounded transition text-accent-ink hover:bg-line ${open ? 'bg-line' : ''}`}
      >
        <Ellipsis className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-52 overflow-hidden rounded-lg border border-line-strong bg-surface-raised py-1 shadow-lg"
        >
          {items.map((item) => {
            const Icon = item.icon
            const content = (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </>
            )
            return (
              <div key={item.label} className={item.danger ? 'mt-1 border-t border-line pt-1' : ''}>
                {item.href ? (
                  <Link href={item.href} role="menuitem" onClick={() => setOpen(false)} className={itemCls(item)}>
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false)
                      item.onClick?.()
                    }}
                    className={itemCls(item)}
                  >
                    {content}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
