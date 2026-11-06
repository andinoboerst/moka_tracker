'use client'

import { useEffect } from 'react'

/**
 * Keeps the screen awake while `active` is true (e.g. while a brew timer runs) and lets go again afterwards.
 * Uses the Screen Wake Lock API; browsers that lack it simply behave as before.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        lock = sentinel
      } catch {
        // Denied (e.g. battery saver) or unsupported context: the timer still works, the screen just may dim
      }
    }

    // The browser drops the lock whenever the tab is hidden, so take it again when the user comes back
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [active])
}
