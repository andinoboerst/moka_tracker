'use client'

import { useEffect } from 'react'

interface ModalProps {
  onClose: () => void
  children: React.ReactNode
  label: string
}

/** Centered dialog with a dimmed backdrop. Closes on Escape or a click outside. */
export default function Modal({ onClose, children, label }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={label} className="w-full max-w-2xl my-auto">
        {children}
      </div>
    </div>
  )
}
