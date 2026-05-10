'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, variables?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('moka_lang') as Language
    if (saved && (saved === 'en' || saved === 'it')) {
      setLanguageState(saved)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('moka_lang', lang)
  }

  const t = (path: string, variables?: Record<string, string | number>): string => {
    const keys = path.split('.')
    let current: any = translations[language]

    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English if key missing in current language
        let fallback: any = translations.en
        for (const fkey of keys) {
          if (fallback[fkey] === undefined) return path
          fallback = fallback[fkey]
        }
        current = fallback
        break
      }
      current = current[key]
    }

    if (typeof current !== 'string') return path

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
