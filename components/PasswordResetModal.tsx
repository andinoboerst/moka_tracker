'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/LanguageContext'
import { Mail } from 'lucide-react'

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEmail('')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-[#d4a574] mb-6">
          {t('common.reset_password')}
        </h2>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <p className="text-green-400 text-sm">{t('common.reset_password_sent')}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
                {t('common.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b6f47] w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#1a1410] border border-[#3d3530] rounded-md text-[#f5f1ed] focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.reset_password')}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-[#8b6f47] hover:text-[#d4a574] text-sm"
            >
              {t('common.cancel')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
