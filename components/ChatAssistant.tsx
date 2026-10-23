'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Trash2, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/LanguageContext'
import { getAuthHeaders } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatAssistant() {
  const { user, loading } = useAuth()
  const { language, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Load saved conversation the first time the panel opens
  useEffect(() => {
    if (!open || historyLoaded || !user) return
    const load = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/chat', { headers })
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
      } finally {
        setHistoryLoaded(true)
      }
    }
    load()
  }, [open, historyLoaded, user])

  // Forget the conversation when the account changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([])
    setHistoryLoaded(false)
  }, [user?.id])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, open])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !user || isSending) return
      setError('')

      const userMessage: ChatMessage = { role: 'user', content: trimmed }
      const nextMessages = [...messages, userMessage]
      setMessages([...nextMessages, { role: 'assistant', content: '' }])
      setInput('')
      setIsSending(true)

      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ messages: nextMessages, language }),
        })

        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || 'Chat request failed')
        }

        // Stream the answer into the last bubble as it arrives
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let answer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          answer += decoder.decode(value, { stream: true })
          setMessages((current) => [...current.slice(0, -1), { role: 'assistant', content: answer }])
        }
        if (!answer.trim()) throw new Error('Sorry, I could not get an answer right now.')
      } catch (err) {
        setMessages((current) => (current[current.length - 1]?.content === '' ? current.slice(0, -1) : current))
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsSending(false)
      }
    },
    [user, isSending, messages, language]
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    send(input)
  }

  const clearHistory = async () => {
    if (!window.confirm(t('feat.chat_clear_confirm'))) return
    try {
      const headers = await getAuthHeaders()
      await fetch('/api/chat', { method: 'DELETE', headers })
      setMessages([])
    } catch (err) {
      console.error('Failed to clear chat:', err)
    }
  }

  if (loading || !user) return null

  const quickPrompts = [t('feat.chat_q1'), t('feat.chat_q2'), t('feat.chat_q3'), t('feat.chat_q4')]

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)]" data-no-print>
      {open ? (
        <div className="w-[380px] max-w-full rounded-2xl bg-surface/95 border border-line shadow-2xl backdrop-blur-xl text-ink overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-canvas/60 border-b border-line">
            <div>
              <p className="text-base font-semibold">{t('chat.title')}</p>
              <p className="text-xs text-muted">{t('chat.description')}</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="rounded-full p-2 hover:bg-line text-muted hover:text-red-400 transition"
                  aria-label={t('feat.chat_clear')}
                  title={t('feat.chat_clear')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-line transition"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(420px,55vh)] min-h-[160px] overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="rounded-2xl rounded-tl-sm bg-canvas/70 p-3 text-sm leading-6 text-ink self-start max-w-[90%]">
                {t('chat.initial_message')}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl p-3 max-w-[85%] ${
                  message.role === 'assistant'
                    ? 'bg-canvas/70 text-ink self-start rounded-tl-sm'
                    : 'bg-accent/20 text-ink self-end rounded-tr-sm'
                }`}
              >
                {message.content ? (
                  <p className="text-sm leading-6 whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <span className="flex gap-1 py-1" aria-label="Thinking">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" />
                  </span>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {messages.length === 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  disabled={isSending}
                  className="text-xs rounded-full border border-line-strong px-3 py-1.5 text-muted hover:text-accent-ink hover:border-accent transition disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {error && <div className="px-4 pb-2 text-xs text-red-400">{error}</div>}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-4 pt-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.input_placeholder')}
              className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-2xl hover:scale-105 transition"
          aria-label="Open Moka Brew chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
