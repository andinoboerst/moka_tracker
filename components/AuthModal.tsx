'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Mail } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      onClose()
      setEmail('')
      setPassword('')
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    const { error } = await signInWithGoogle()

    if (error) {
      setError(error.message)
    } else {
      onClose()
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2d2520] border border-[#3d3530] rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-[#d4a574] mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1410] border border-[#3d3530] rounded-md text-[#f5f1ed] focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#f5f1ed] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1410] border border-[#3d3530] rounded-md text-[#f5f1ed] focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4a574] hover:bg-[#c49464] text-[#1a1410] font-bold py-2 px-4 rounded transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3d3530]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#2d2520] text-[#8b6f47]">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded transition disabled:opacity-50 border border-gray-300"
        >
          <Mail className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#8b6f47] hover:text-[#d4a574] text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-[#8b6f47] hover:text-[#d4a574] text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
