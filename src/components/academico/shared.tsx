'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { NivelRiesgo } from '@/lib/types'
import { colorNivelRiesgo } from '@/lib/risk'

// --- Tarjeta de estadística (KPI) ---
export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sublabel?: string
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-rose-600 dark:text-rose-400',
    primary: 'text-primary',
  }[tone]
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn('text-2xl font-bold tabular-nums leading-tight', toneClass)}>
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Badge de nivel de riesgo ---
export function RiskBadge({ nivel }: { nivel: NivelRiesgo }) {
  const c = colorNivelRiesgo(nivel)
  const label = nivel === 'alto' ? 'Riesgo alto' : nivel === 'medio' ? 'Riesgo medio' : 'Riesgo bajo'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        c.badge
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {label}
    </span>
  )
}

// --- Badge de promedio con color según valor ---
export function PromedioBadge({ promedio }: { promedio: number }) {
  let cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  if (promedio < 51)
    cls = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
  else if (promedio < 70)
    cls = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-bold tabular-nums', cls)}>
      {promedio.toFixed(1)}
    </span>
  )
}

// --- Estado de carga ---
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="size-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// --- Estado vacío ---
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
    </div>
  )
}

// --- Barra de progreso simple (0-100) ---
export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all', barClassName || 'bg-primary')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// --- Encabezado de sección ---
export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
