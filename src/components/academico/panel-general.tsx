'use client'

import { Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Users, BookOpen, TrendingUp, AlertTriangle, Trophy, Target, Radar as RadarIcon } from 'lucide-react'
import { useAcademicData } from '@/hooks/use-academic'
import { StatCard, SectionHeader, RiskBadge, ProgressBar, PromedioBadge, EmptyState } from './shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function PanelGeneral() {
  const { data } = useAcademicData()
  if (!data) return null

  const { resumen, riesgoGeneral, estudiantes } = data
  const enRiesgo = resumen.distribucionRiesgo.alto + resumen.distribucionRiesgo.medio
  const pctEnRiesgo = estudiantes.length
    ? Math.round((enRiesgo / estudiantes.length) * 100)
    : 0

  // Datos para gráficos
  const dataBarrasMateria = resumen.promedioPorMateria.map((m) => ({
    nombre: m.nombre,
    promedio: m.promedio,
    color: m.color,
  }))

  const dataRiesgo = [
    { name: 'Riesgo bajo', value: resumen.distribucionRiesgo.bajo, color: '#10b981' },
    { name: 'Riesgo medio', value: resumen.distribucionRiesgo.medio, color: '#f59e0b' },
    { name: 'Riesgo alto', value: resumen.distribucionRiesgo.alto, color: '#f43f5e' },
  ]

  const dataAprobacion = [
    { name: 'Aprobadas', value: resumen.aprobadas, color: '#10b981' },
    { name: 'Reprobadas', value: resumen.reprobadas, color: '#f43f5e' },
  ]

  const topAlertas = riesgoGeneral
    .filter((r) => r.nivel !== 'bajo')
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 5)

  // Promedio por competencia del grupo (uniendo notas con evaluaciones)
  const evCompetencia = new Map<string, string>()
  for (const m of data.materias) {
    for (const ev of m.evaluaciones) evCompetencia.set(ev.id, ev.competencia)
  }
  const compMap = new Map<string, { suma: number; count: number }>()
  for (const n of data.notas) {
    const comp = evCompetencia.get(n.evaluacionId)
    if (!comp) continue
    if (!compMap.has(comp)) compMap.set(comp, { suma: 0, count: 0 })
    const e = compMap.get(comp)!
    e.suma += n.valor
    e.count += 1
  }
  const dataCompetenciasGrupo = Array.from(compMap.entries())
    .map(([competencia, { suma, count }]) => ({
      competencia,
      promedio: Math.round((suma / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => a.promedio - b.promedio)
  const competenciasDebilesGrupo = dataCompetenciasGrupo.filter((c) => c.promedio < 70)
  const minCompGrupo = dataCompetenciasGrupo[0]?.promedio ?? 100
  const colorRadarGrupo = minCompGrupo < 51 ? '#f43f5e' : minCompGrupo < 70 ? '#f59e0b' : 'var(--primary)'

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Panel general académico"
        description="Visión global del rendimiento, riesgo y avance del grupo."
        icon={Target}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Estudiantes"
          value={resumen.totalEstudiantes}
          sublabel={`${resumen.totalMaterias} materias activas`}
          tone="primary"
        />
        <StatCard
          icon={BookOpen}
          label="Evaluaciones"
          value={resumen.totalEvaluaciones}
          sublabel={`${resumen.totalNotas} notas registradas`}
        />
        <StatCard
          icon={TrendingUp}
          label="Promedio general"
          value={resumen.promedioGeneral.toFixed(1)}
          sublabel="sobre 100 · ponderado"
          tone={resumen.promedioGeneral >= 70 ? 'success' : resumen.promedioGeneral >= 60 ? 'warning' : 'danger'}
        />
        <StatCard
          icon={AlertTriangle}
          label="En riesgo"
          value={`${enRiesgo}/${estudiantes.length}`}
          sublabel={`${pctEnRiesgo}% del grupo requiere atención`}
          tone={enRiesgo > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Promedio por materia */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Promedio por materia</CardTitle>
            <CardDescription>Rendimiento promedio del grupo en cada materia.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataBarrasMateria} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="nombre"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={50}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v.toFixed(1)} / 100`, 'Promedio']}
                  />
                  <Bar dataKey="promedio" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {dataBarrasMateria.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Leyenda personal con datos */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {resumen.promedioPorMateria.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="font-medium text-foreground">{m.promedio.toFixed(1)}</span>
                  <span className="truncate text-muted-foreground">{m.nombre}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución de riesgo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución de riesgo</CardTitle>
            <CardDescription>Estudiantes por nivel de riesgo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataRiesgo}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {dataRiesgo.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {dataRiesgo.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasa de aprobación + Top alertas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Aprobación */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasa de aprobación</CardTitle>
            <CardDescription>Notas aprobadas vs reprobadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[dataAprobacion[0], dataAprobacion[1]]} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, resumen.totalNotas]} hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {dataAprobacion.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/40">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{resumen.aprobadas}</p>
                <p className="text-xs text-muted-foreground">Aprobadas (≥51)</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/40">
                <p className="text-xl font-bold text-rose-700 dark:text-rose-400">{resumen.reprobadas}</p>
                <p className="text-xs text-muted-foreground">Reprobadas (&lt;51)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top alertas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Alertas prioritarias</CardTitle>
                <CardDescription>Estudiantes que requieren atención inmediata.</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="size-3" /> {topAlertas.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {topAlertas.length === 0 ? (
              <EmptyState icon={Trophy} title="Sin alertas activas" description="Todos los estudiantes presentan un riesgo bajo." />
            ) : (
              <div className="scroll-academico max-h-80 space-y-2 overflow-y-auto pr-1">
                {topAlertas.map((r) => (
                  <div
                    key={r.estudianteId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{r.estudianteNombre}</p>
                        <RiskBadge nivel={r.nivel} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {r.factores[0]?.descripcion ?? 'Sin factores identificados'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-lg font-bold tabular-nums text-foreground">{r.promedio.toFixed(0)}</span>
                      <div className="w-20">
                        <ProgressBar
                          value={r.puntaje}
                          barClassName={r.nivel === 'alto' ? 'bg-rose-500' : r.nivel === 'medio' ? 'bg-amber-500' : 'bg-emerald-500'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Competencias del grupo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RadarIcon className="size-4 text-primary" />
              Competencias del grupo
            </CardTitle>
            <CardDescription>Promedio del grupo por competencia evaluada.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dataCompetenciasGrupo} outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" axisLine={false} />
                  <Radar name="Promedio" dataKey="promedio" stroke={colorRadarGrupo} fill={colorRadarGrupo} fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}/100`, 'Promedio']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Competencias a reforzar</CardTitle>
              <Badge variant="secondary">{competenciasDebilesGrupo.length}</Badge>
            </div>
            <CardDescription>Competencias del grupo con promedio por debajo de 70.</CardDescription>
          </CardHeader>
          <CardContent>
            {competenciasDebilesGrupo.length === 0 ? (
              <EmptyState icon={Trophy} title="Grupo sólido" description="Ninguna competencia del grupo está por debajo del umbral." />
            ) : (
              <div className="scroll-academico max-h-72 space-y-2 overflow-y-auto pr-1">
                {competenciasDebilesGrupo.map((c) => {
                  const estado =
                    c.promedio < 51
                      ? { label: 'Crítica', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' }
                      : { label: 'Débil', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
                  return (
                    <div key={c.competencia} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{c.competencia}</p>
                        <p className="text-xs text-muted-foreground">{c.count} notas</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', estado.cls)}>{estado.label}</span>
                        <PromedioBadge promedio={c.promedio} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
