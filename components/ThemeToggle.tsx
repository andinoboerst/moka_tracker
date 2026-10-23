'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    // Sync with the theme set by the pre-hydration script
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('moka_theme', next)
    } catch {
      // storage unavailable
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-line text-muted hover:text-accent ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
