import type { LucideProps } from 'lucide-react'

type Mood = 'rough' | 'sad' | 'ok' | 'happy' | 'ecstatic'

const moodFor = (rating: number): Mood =>
  rating <= 2 ? 'rough' : rating <= 4 ? 'sad' : rating <= 6 ? 'ok' : rating <= 8 ? 'happy' : 'ecstatic'

/**
 * Vibe rating (1-10) as a coffee bean with a face: five moods, from knocked-out to over the moon.
 * Drawn with currentColor so it follows the surrounding text colour, like the icons it replaced.
 */
export default function VibeIcon({ rating, strokeWidth = 1.75, className, ...props }: { rating: number } & LucideProps) {
  const mood = moodFor(rating)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* the bean */}
      <g transform="rotate(-12 12 12.5)">
        <ellipse cx="12" cy="12.5" rx="8" ry="9.5" fill="currentColor" fillOpacity="0.14" />
        {/* the bean's centre crease, peeking out above the face */}
        <path d="M12.5 3.4q-1.5 1.7 0 3.3" strokeWidth="1.2" />
      </g>

      {mood === 'rough' && (
        <>
          <path d="M8 9.5l2.4 2.4M10.4 9.5L8 11.9M13.6 9.5l2.4 2.4M16 9.5l-2.4 2.4" />
          <path d="M8.5 17c1-1.3 2-1.3 3 0s2 1.3 3 0" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <circle cx="9.3" cy="11" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="14.7" cy="11" r="0.9" fill="currentColor" stroke="none" />
          <path d="M9.3 17c1.6-2 4.8-2 5.4 0" />
          <path d="M8.1 12.9q-1 1.5 0 2.1q1-.6 0-2.1z" fill="currentColor" strokeWidth="0.8" />
        </>
      )}
      {mood === 'ok' && (
        <>
          <circle cx="9.3" cy="11" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="14.7" cy="11" r="0.9" fill="currentColor" stroke="none" />
          <path d="M9.5 15.5q2.5 1.2 5 0" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M7.8 11.2q1.5-2.2 3 0M13.2 11.2q1.5-2.2 3 0" />
          <path d="M8.8 14.4q3.2 4 6.4 0" />
          <circle cx="7.3" cy="14.4" r="1.1" fill="currentColor" fillOpacity="0.35" stroke="none" />
          <circle cx="16.7" cy="14.4" r="1.1" fill="currentColor" fillOpacity="0.35" stroke="none" />
        </>
      )}
      {mood === 'ecstatic' && (
        <>
          <path d="M9.3 12.4l-1.9-1.9a1.2 1.2 0 0 1 1.9-1.5 1.2 1.2 0 0 1 1.9 1.5zM14.7 12.4l-1.9-1.9a1.2 1.2 0 0 1 1.9-1.5 1.2 1.2 0 0 1 1.9 1.5z" fill="currentColor" strokeWidth="0.9" />
          <path d="M8.4 14.4h7.2a3.6 3.6 0 0 1-7.2 0z" fill="currentColor" fillOpacity="0.4" />
          <path d="M20.5 2.2v3.2M18.9 3.8h3.2" strokeWidth="1.3" />
          <path d="M3.6 3.2v2.4M2.4 4.4h2.4" strokeWidth="1.3" />
          <path d="M21 17.5v1.8M20.1 18.4h1.8" strokeWidth="1.2" />
        </>
      )}
    </svg>
  )
}
