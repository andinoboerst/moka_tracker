import { Frown, Laugh, Meh, Smile, type LucideProps } from 'lucide-react'

/** Vibe rating (1-10) as a crisp icon instead of a system emoji. */
export default function VibeIcon({ rating, ...props }: { rating: number } & LucideProps) {
  if (rating <= 2) return <Frown aria-hidden="true" {...props} />
  if (rating <= 4) return <Meh aria-hidden="true" {...props} />
  if (rating <= 8) return <Smile aria-hidden="true" {...props} />
  return <Laugh aria-hidden="true" {...props} />
}
