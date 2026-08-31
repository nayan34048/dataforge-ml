import React, { useState } from 'react'

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg' | 'sm'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-[15px]',
    lg: 'px-6 py-3.5 text-base',
  }
  const variants = {
    primary: 'bg-teal text-mist hover:bg-teal-strong',
    secondary:
      'bg-transparent border border-border dark:border-border-dark text-ink dark:text-mist hover:border-teal hover:text-teal dark:hover:text-amber dark:hover:border-amber',
    ghost: 'bg-transparent text-ink-soft dark:text-mist-soft hover:text-ink dark:hover:text-mist',
    danger: 'bg-clay text-mist hover:bg-clay/90',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-border dark:border-border-dark rounded-lg bg-white/60 dark:bg-white/[0.03] ${className}`}>
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'teal' }: { children: React.ReactNode; tone?: 'teal' | 'amber' | 'clay' | 'neutral' }) {
  const tones = {
    teal: 'bg-teal-soft text-teal-strong dark:bg-teal/20 dark:text-teal-soft',
    amber: 'bg-amber-soft text-amber-strong dark:bg-amber/20 dark:text-amber',
    clay: 'bg-clay-soft text-clay dark:bg-clay/20 dark:text-clay-soft',
    neutral: 'bg-paper-dim text-ink-soft dark:bg-white/10 dark:text-mist-soft',
  }
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More information"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink-soft/40 dark:border-mist-soft/40 text-[10px] text-ink-soft dark:text-mist-soft hover:border-teal hover:text-teal dark:hover:border-amber dark:hover:text-amber"
      >
        ?
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-border dark:border-border-dark bg-paper dark:bg-forest-dim p-2.5 text-xs leading-relaxed text-ink dark:text-mist shadow-lg">
          {text}
        </span>
      )}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-1 text-sm text-teal dark:text-amber">{eyebrow}</p>}
      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink dark:text-mist">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-ink-soft dark:text-mist-soft">{description}</p>}
    </div>
  )
}

export function Callout({ tone = 'teal', children }: { tone?: 'teal' | 'amber' | 'clay'; children: React.ReactNode }) {
  const tones = {
    teal: 'border-teal/30 bg-teal-soft/40 dark:bg-teal/10',
    amber: 'border-amber/40 bg-amber-soft/50 dark:bg-amber/10',
    clay: 'border-clay/40 bg-clay-soft/50 dark:bg-clay/10',
  }
  return <div className={`rounded-md border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>{children}</div>
}
