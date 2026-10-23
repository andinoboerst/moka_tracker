'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, variables?: Record<string, string | number>) => string
}

/** Walk a nested translation object; returns the string at `keys` or undefined. */
function lookup(root: unknown, keys: string[]): string | undefined {
  let node: unknown = root
  for (const key of keys) {
    if (typeof node !== 'object' || node === null || !(key in node)) return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return typeof node === 'string' ? node : undefined
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Restore the saved language after hydration (reading localStorage during render would cause a hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem('moka_lang')
    if (saved === 'en' || saved === 'it') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('moka_lang', lang)
  }

  const t = (path: string, variables?: Record<string, string | number>): string => {
    const keys = path.split('.')
    // Fall back to English if the key is missing in the current language
    const current = lookup(translations[language], keys) ?? lookup(translations.en, keys)

    if (current === undefined) return path

    let result = current
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, String(value))
      })
    }

    return result
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
