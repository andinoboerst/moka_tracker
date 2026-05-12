'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/LanguageContext'
import { getAuthHeaders } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatAssistant() {
  const { user, loading } = useAuth()
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask me about your Moka setup, beans, grind, water temp, or extraction and I will give advice tailored to your equipment.',
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const trimmed = input.trim()
    if (!trimmed || !user) return

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ messages: nextMessages, language }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData?.error || 'Chat request failed')
      }

      const data = await response.json()
      const assistantMessage = data?.answer || 'Sorry, I could not get an answer right now.'
      setMessages((current) => [...current, { role: 'assistant', content: assistantMessage }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSending(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-[360px] max-w-full rounded-3xl bg-[#1a1410]/95 border border-[#3d3530] shadow-2xl backdrop-blur-xl text-[#f5f1ed] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#2d2520] border-b border-[#3d3530]">
            <div>
              <p className="text-base font-semibold">Moka Brew Assistant</p>
              <p className="text-xs text-[#8b6f47]">Ask about your moka setup or inventory.</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-2 hover:bg-[#3d3530] transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-3xl p-3 ${
                  message.role === 'assistant'
                    ? 'bg-[#2d2520] text-[#f5f1ed] self-start'
                    : 'bg-[#d4a574]/15 text-[#f5f1ed] self-end'
                }`}
              >
                <p className="text-sm leading-6 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>

          {error && <div className="px-4 pb-2 text-xs text-red-300">{error}</div>}

          <form onSubmit={handleSend} className="flex items-center gap-2 px-4 pb-4 pt-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your moka brew..."
              className="flex-1 rounded-2xl border border-[#3d3530] bg-[#121212] px-3 py-2 text-sm text-[#f5f1ed] outline-none focus:border-[#d4a574]"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a574] text-[#1a1410] transition hover:bg-[#e5b886] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d4a574] text-[#1a1410] shadow-2xl hover:scale-105 transition"
          aria-label="Open Moka Brew chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
