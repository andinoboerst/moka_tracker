interface PageHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}

/** Branded page heading: optional eyebrow, editorial serif title, muted subtitle and a hairline tricolore rule. */
export default function PageHeading({ eyebrow, title, subtitle, className = 'mb-10' }: PageHeadingProps) {
  return (
    <div className={`${className} rise-in`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-4xl md:text-5xl font-display font-semibold text-ink tracking-tight mb-3">{title}</h1>
      {subtitle && <p className="text-muted text-lg mb-5 max-w-2xl">{subtitle}</p>}
      <div className="tricolore w-16" aria-hidden="true" />
    </div>
  )
}
