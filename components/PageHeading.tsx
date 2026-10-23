interface PageHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}

/** Branded page heading: eyebrow, gradient serif title, italic subtitle and a tricolore rule. */
export default function PageHeading({ eyebrow = '☕ Moka Tracker', title, subtitle, className = 'mb-10' }: PageHeadingProps) {
  return (
    <div className={`${className} rise-in`}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-4xl md:text-5xl font-serif font-bold gradient-text mb-3 tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted text-lg italic mb-5">{subtitle}</p>}
      <div className="tricolore w-20" aria-hidden="true" />
    </div>
  )
}
