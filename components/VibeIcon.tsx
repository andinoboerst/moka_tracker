const MOODS: [maxRating: number, emoji: string][] = [
  [2, '💀'], // Sacrilegio!
  [4, '😬'], // Mamma Mia...
  [6, '🤷'], // Così così (the Italian shrug)
  [8, '😋'], // Che bontà!
  [10, '🤌'], // Nonna approved (chef's kiss, the pinched-fingers gesture)
]

export const vibeEmoji = (rating: number) => (MOODS.find(([max]) => rating <= max) ?? MOODS[MOODS.length - 1])[1]

/** Vibe rating (1-10) as an emoji. `size` is the font size in px. */
export default function VibeIcon({ rating, size = 24, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block leading-none select-none ${className ?? ''}`}
      style={{ fontSize: size, fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
    >
      {vibeEmoji(rating)}
    </span>
  )
}
