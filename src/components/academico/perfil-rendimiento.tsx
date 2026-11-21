'use client'

import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, TrendingDown, Activity, Scale, Weight, Radar as RadarIcon, Info } from 'lucide-react'
import type { DetalleEstudiante } from '@/hooks/use-academic'
import { RiskBadge, PromedioBadge, EmptyState, ProgressBar } from './shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bar, BarChart, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'

const ICONOS_FACTOR: Record<string, React.ComponentType<{ className?: string }>> = {
  promedio: Activity,
  reprobadas: ShieldX,
  tendencia: TrendingDown,
  peso_alto: Weight,
  variabilidad: Scale,
}

const ETIQUETA_FACTOR: Record<string, string> = {
  promedio: 'Promedio',
  reprobadas: 'Reprobadas',
  tendencia: 'Tendencia',
  peso_alto: 'Alto peso',
  variabilidad: 'Variabilidad',
}

// Componente reutilizable: muestra el perfil de rendimiento de un estudiante.
// Lo usan tanto el docente (panel de riesgo) como el propio estudiante (su panel personal).
export function PerfilRendimiento({
  detalle,
  estudiante,
}: {
  detalle: DetalleEstudiante
  estudiante: { id: string; codigo: string; nombre: string; apellido: string; semestre: number; carrera: string }
}) {
  const { riesgoGeneral, riesgoPorMateria, notas } = detalle

  // Estado "sin calificaciones": distinto de "riesgo bajo". Evita mostrar 0/100
  // y "riesgo bajo" a un estudiante que aún no tiene notas.
  if (!riesgoGeneral.tieneDatos) {
    return (
      <Card className="overflow-hidden border-2 border-border bg-muted/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Info className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {estudiante.nombre} {estudiante.apellido}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  Sin calificaciones
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {estudiante.codigo} · {estudiante.carrera} · Sem. {estudiante.semestre}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Aún no hay notas registradas. El promedio y el riesgo se calculan automáticamente en cuanto se registren calificaciones o se rinda una evaluación.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const configuracion = {
    alto: {
      icon: ShieldX,
      bg: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      bar: 'bg-rose-500',
      label: 'Riesgo alto',
      descripcion: 'El estudiante tiene alta probabilidad de no aprobar. Se recomienda intervención inmediata.',
    },
    medio: {
      icon: ShieldAlert,
      bg: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      bar: 'bg-amber-500',
      label: 'Riesgo medio',
      descripcion: 'El estudiante muestra señales de alerta. Conviene reforzar antes de que empeore.',
    },
    bajo: {
      icon: ShieldCheck,
      bg: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      bar: 'bg-emerald-500',
      label: 'Riesgo bajo',
      descripcion: 'El estudiante va por buen camino. Mantener el seguimiento habitual.',
    },
  }[riesgoGeneral.nivel]

  const Icon = configuracion.icon

  const dataEvolucion = notas.map((n) => ({
    nombre: n.evaluacion.nombre.length > 12 ? n.evaluacion.nombre.slice(0, 11) + '…' : n.evaluacion.nombre,
    valor: n.valor,
    color: n.materia.color,
    materia: n.materia.nombre,
  }))

  const competenciaMap = new Map<string, { suma: number; count: number }>()
  for (const n of notas) {
    const comp = n.evaluacion.competencia
    if (!competenciaMap.has(comp)) competenciaMap.set(comp, { suma: 0, count: 0 })
    const e = competenciaMap.get(comp)!
    e.suma += n.valor
    e.count += 1
  }
  const dataCompetencias = Array.from(competenciaMap.entries())
    .map(([competencia, { suma, count }]) => ({
      competencia,
      promedio: Math.round((suma / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => a.promedio - b.promedio)
  const minCompetencia = dataCompetencias[0]?.promedio ?? 100
  const colorRadar = minCompetencia < 51 ? '#f43f5e' : minCompetencia < 70 ? '#f59e0b' : 'var(--primary)'
  const competenciasDebiles = dataCompetencias.filter((c) => c.promedio < 70)

  return (
    <div className="space-y-6">
      {/* Tarjeta principal de riesgo */}
      <Card className={cn('overflow-hidden border-2', configuracion.bg)}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('flex size-14 items-center justify-center rounded-2xl', configuracion.text)}>
                <Icon className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {estudiante.nombre} {estudiante.apellido}
                  </h3>
                  <RiskBadge nivel={riesgoGeneral.nivel} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {estudiante.codigo} · {estudiante.carrera} · Sem. {estudiante.semestre}
                </p>
                <p className={cn('mt-1 text-sm font-medium', configuracion.text)}>
                  {configuracion.descripcion}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Promedio</p>
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {riesgoGeneral.promedio.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Puntaje riesgo</p>
                <p className={cn('text-3xl font-bold tabular-nums', configuracion.text)}>
                  {riesgoGeneral.puntaje}
                </p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={riesgoGeneral.puntaje} barClassName={configuracion.bar} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {riesgoGeneral.reprobadas} de {riesgoGeneral.totalEvaluaciones} evaluaciones reprobadas · nivel:{' '}
              <span className="font-medium text-foreground">{configuracion.label}</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Índice de riesgo: <span className="text-emerald-600 dark:text-emerald-400">0–30 bajo</span> · <span className="text-amber-600 dark:text-amber-400">31–60 medio</span> · <span className="text-rose-600 dark:text-rose-400">61–100 alto</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Factores de riesgo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Factores que influyen en la predicción
            </CardTitle>
            <CardDescription>Reglas transparentes y auditable.</CardDescription>
          </CardHeader>
          <CardContent>
            {riesgoGeneral.factores.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Sin factores de riesgo" description="No se detectaron señales de alerta en el desempeño." />
            ) : (
              <ul className="space-y-3">
                {riesgoGeneral.factores.map((f, i) => {
                  const FIcon = ICONOS_FACTOR[f.tipo] ?? Activity
                  return (
                    <li key={i} className="flex gap-3 rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FIcon className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{f.descripcion}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {ETIQUETA_FACTOR[f.tipo] ?? f.tipo}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.evidencia}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Evolución de notas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Evolución de calificaciones
            </CardTitle>
            <CardDescription>Notas por evaluación (ordenadas por fecha).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)', color: 'var(--popover-foreground)', fontSize: 12 }}
                    formatter={(v: number) => [`${v}/100`, 'Nota']}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { materia: string } | undefined
                      return p?.materia ?? ''
                    }}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {dataEvolucion.map((entry, i) => (
                      <Cell key={i} fill={entry.valor < 51 ? '#f43f5e' : entry.valor < 70 ? '#f59e0b' : entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {Array.from(new Set(dataEvolucion.map((d) => d.materia))).map((m) => {
                const color = dataEvolucion.find((d) => d.materia === m)?.color
                return (
                  <span key={m} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ background: color }} />
                    {m}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Perfil de competencias */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <RadarIcon className="size-4 text-primary" />
                Perfil de competencias
              </CardTitle>
              <CardDescription>Promedio por competencia. Las más bajas son las competencias débiles a reforzar.</CardDescription>
            </div>
            {competenciasDebiles.length > 0 && (
              <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {competenciasDebiles.length} débil{competenciasDebiles.length > 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="h-72 lg:col-span-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dataCompetencias} outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" axisLine={false} />
                  <Radar name="Promedio" dataKey="promedio" stroke={colorRadar} fill={colorRadar} fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)', color: 'var(--popover-foreground)', fontSize: 12 }}
                    formatter={(v: number) => [`${v}/100`, 'Promedio']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 lg:col-span-3">
              {dataCompetencias.map((c) => {
                const estado =
                  c.promedio < 51
                    ? { label: 'Crítica', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' }
                    : c.promedio < 70
                      ? { label: 'Débil', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
                      : { label: 'Sólida', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
                return (
                  <div key={c.competencia} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.competencia}</p>
                      <p className="text-xs text-muted-foreground">{c.count} evaluacion{c.count > 1 ? 'es' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold', estado.cls)}>{estado.label}</span>
                      <PromedioBadge promedio={c.promedio} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riesgo por materia */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Riesgo por materia</CardTitle>
          <CardDescription>Desglose del riesgo en cada materia del estudiante.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {riesgoPorMateria.map((r) => (
              <div key={r.materiaId} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ background: r.materiaColor ?? '#10b981' }} />
                    <div>
                      <p className="font-semibold text-foreground">{r.materiaNombre}</p>
                      <p className="text-xs text-muted-foreground">{r.reprobadas}/{r.totalEvaluaciones} reprobadas</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PromedioBadge promedio={r.promedio} />
                    <RiskBadge nivel={r.nivel} />
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={r.puntaje} barClassName={r.nivel === 'alto' ? 'bg-rose-500' : r.nivel === 'medio' ? 'bg-amber-500' : 'bg-emerald-500'} />
                </div>
                {r.factores.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {r.factores.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-0.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span>{f.descripcion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
