/**
 * Calculate brew ratio: Coffee : Water In
 * Returns as a formatted string (e.g., "1:2.5")
 */
export const calculateBrewRatio = (coffeeWeight: number, waterIn: number): number => {
  if (waterIn === 0) return 0
  return Number((waterIn / coffeeWeight).toFixed(2))
}

/**
 * Calculate extraction ratio: Coffee : Yield Out
 * Returns as a formatted string (e.g., "1:1.8")
 */
export const calculateExtractionRatio = (coffeeWeight: number, yieldOut: number): number => {
  if (yieldOut === 0) return 0
  return Number((yieldOut / coffeeWeight).toFixed(2))
}

/**
 * Format ratio for display
 */
export const formatRatio = (ratio: number): string => {
  return `1:${(ratio).toFixed(2)}`
}

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Get vibe color based on rating
 */
export const getVibeColor = (rating: number): string => {
  if (rating <= 3) return 'text-red-400'
  if (rating <= 5) return 'text-yellow-400'
  if (rating <= 7) return 'text-blue-400'
  return 'text-green-400'
}

/**
 * Get vibe emoji based on rating
 */
export const getVibeEmoji = (rating: number): string => {
  if (rating <= 2) return '😤'
  if (rating <= 4) return '😐'
  if (rating <= 6) return '🙂'
  if (rating <= 8) return '😊'
  return '🤩'
}

/**
 * Returns the Authorization header for authenticated API calls.
 * Must be called in a browser context (client component or event handler).
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}
