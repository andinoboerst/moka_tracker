/**
 * Calculate brew ratio: Coffee : Water In
 * Returns as a formatted string (e.g., "1:2.5")
 */
export const calculateBrewRatio = (coffeeWeight: number, waterIn: number): number => {
  if (waterIn === 0) return 0
  return Number((coffeeWeight / waterIn).toFixed(2))
}

/**
 * Calculate extraction ratio: Coffee : Yield Out
 * Returns as a formatted string (e.g., "1:1.8")
 */
export const calculateExtractionRatio = (coffeeWeight: number, yieldOut: number): number => {
  if (yieldOut === 0) return 0
  return Number((coffeeWeight / yieldOut).toFixed(2))
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
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
