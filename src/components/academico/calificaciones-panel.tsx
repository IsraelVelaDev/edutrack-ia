'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, Save, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { useAcademicData, useGuardarNota } from '@/hooks/use-academic'
import { SectionHeader, PromedioBadge, EmptyState } from './shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CalificacionesPanel() {
  const { data } = useAcademicData()
  const guardar = useGuardarNota()
  const [materiaId, setMateriaId] = useState<string>('')
  const [editingNota, setEditingNota] = useState<{ estudianteId: string; evaluacionId: string; valor: number; observacion: string; respuestaEjemplo: string; estudianteNombre: string; evaluacionNombre: string } | null>(null)

  // useMemo debe ir antes de cualquier return condicional
  const materiaActual = useMemo(() => {
    if (!data) return undefined
    if (materiaId) return data.materias.find((m) => m.id === materiaId)
    return data.materias[0]
  }, [data, materiaId])

  if (!data) return null

  if (data.materias.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Calificaciones" description="Registro de notas por materia y evaluación." icon={ClipboardList} />
        <EmptyState icon={ClipboardList} title="Sin materias" description="No hay materias para mostrar calificaciones." />
      </div>
    )
  }

  // Construir matriz: para cada estudiante, sus notas en las evaluaciones de la materia
  const evaluaciones = materiaActual?.evaluaciones ?? []
  const notaMap = new Map<string, { valor: number; observacion: string | null; respuestaEjemplo: string | null; id: string }>()
  data.notas.forEach((n) => {
    notaMap.set(`${n.estudianteId}|${n.evaluacionId}`, {
      id: n.id,
      valor: n.valor,
      observacion: n.observacion,
      respuestaEjemplo: n.respuestaEjemplo,
    })
  })

  function promedioPonderado(estudianteId: string): number {
    let sumaPond = 0
    let sumaPesos = 0
    for (const ev of evaluaciones) {
      const n = notaMap.get(`${estudianteId}|${ev.id}`)
      if (n) {
        sumaPond += n.valor * ev.peso
        sumaPesos += ev.peso
      }
    }
    if (sumaPesos === 0) return 0
    return Math.round((sumaPond / sumaPesos) * 10) / 10
  }

  function handleGuardarNota(estudianteId: string, evaluacionId: string, valor: number) {
    if (isNaN(valor) || valor < 0 || valor > 100) {
      toast.error('Nota inválida', { description: 'Debe ser un número entre 0 y 100.' })
      return
    }
    guardar.mutate(
      { estudianteId, evaluacionId, valor },
      {
        onSuccess: () => {
          toast.success('Nota guardada', { description: `${valor}/100` })
        },
        onError: (err: Error) => toast.error('Error', { description: err.message }),
      }
    )
  }

  function handleGuardarDetalle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingNota) return
    const formData = new FormData(e.currentTarget)
    guardar.mutate(
      {
        estudianteId: editingNota.estudianteId,
        evaluacionId: editingNota.evaluacionId,
        valor: editingNota.valor,
        observacion: String(formData.get('observacion') || '').trim() || undefined,
        respuestaEjemplo: String(formData.get('respuestaEjemplo') || '').trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Detalle actualizado', {
            description: 'Observación y evidencia guardadas. Disponibles para el análisis IA.',
          })
          setEditingNota(null)
        },
        onError: (err: Error) => toast.error('Error', { description: err.message }),
      }
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Calificaciones"
        description="Registra y edita las notas por materia y evaluación."
        icon={ClipboardList}
        action={
          <Select value={materiaActual?.id} onValueChange={setMateriaId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Seleccionar materia" />
            </SelectTrigger>
            <SelectContent>
              {data.materias.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                    {m.nombre}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {materiaActual && (
        <Card className="overflow-hidden border-border/60">
          <CardHeader className="bg-muted/40 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: materiaActual.color }} />
                <CardTitle className="text-base">{materiaActual.nombre}</CardTitle>
                <span className="text-xs text-muted-foreground">· {materiaActual.codigo} · Sem. {materiaActual.semestre}</span>
              </div>
              <CardDescription className="text-xs">
                {materiaActual.descripcion}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Tabla con scroll horizontal en móvil */}
            <div className="scroll-academico overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 min-w-[180px] bg-card">Estudiante</TableHead>
                    {evaluaciones.map((ev) => (
                      <TableHead key={ev.id} className="text-center min-w-[110px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-semibold">{ev.nombre}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">Peso {ev.peso}%</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center bg-muted/30">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.estudiantes.map((est) => {
                    const prom = promedioPonderado(est.id)
                    return (
                      <TableRow key={est.id}>
                        <TableCell className="sticky left-0 z-10 bg-card font-medium">
                          <div className="flex flex-col">
                            <span>{est.nombre} {est.apellido}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">{est.codigo}</span>
                          </div>
                        </TableCell>
                        {evaluaciones.map((ev) => {
                          const n = notaMap.get(`${est.id}|${ev.id}`)
                          const valor = n?.valor
                          const guardandoEsta =
                            guardar.isPending &&
                            guardar.variables?.estudianteId === est.id &&
                            guardar.variables?.evaluacionId === ev.id
                          return (
                            <TableCell key={ev.id} className="p-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    defaultValue={valor ?? ''}
                                    key={`${est.id}-${ev.id}`}
                                    disabled={guardandoEsta}
                                    onBlur={(e) => {
                                      const v = Number(e.target.value)
                                      if (e.target.value !== '' && (!isNaN(v))) {
                                        if (v !== valor) handleGuardarNota(est.id, ev.id, v)
                                      }
                                    }}
                                    className={cn(
                                      'h-9 w-16 text-center tabular-nums',
                                      guardandoEsta && 'opacity-60',
                                      valor !== undefined && valor < 51
                                        ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                                        : valor !== undefined && valor < 70
                                          ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                                          : ''
                                    )}
                                    placeholder="—"
                                  />
                                  {guardandoEsta && (
                                    <Loader2 className="absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-primary" />
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    setEditingNota({
                                      estudianteId: est.id,
                                      evaluacionId: ev.id,
                                      valor: valor ?? 0,
                                      observacion: n?.observacion ?? '',
                                      respuestaEjemplo: n?.respuestaEjemplo ?? '',
                                      estudianteNombre: `${est.nombre} ${est.apellido}`,
                                      evaluacionNombre: ev.nombre,
                                    })
                                  }
                                  className={cn(
                                    'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                    n?.observacion || n?.respuestaEjemplo ? 'text-primary' : ''
                                  )}
                                  title="Detalle / evidencia"
                                  aria-label="Editar detalle"
                                >
                                  <FileText className="size-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center bg-muted/30">
                          <PromedioBadge promedio={prom} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/50" />
          Reprobado (&lt;51)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50" />
          En riesgo (51–69)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50" />
          Aprobado (≥70)
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" />
          Detalle / evidencia (alimenta el análisis IA)
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Las notas se guardan automáticamente al salir del campo. El promedio es
          <span className="font-semibold"> ponderado por el peso de cada evaluación</span>. Las
          <span className="font-semibold"> evidencias de respuesta</span> (ícono de documento) se usan
          luego para el análisis de brechas de aprendizaje con IA.
        </p>
      </div>

      {/* Dialog de detalle */}
      <Dialog open={!!editingNota} onOpenChange={(o) => !o && setEditingNota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de la nota</DialogTitle>
            <DialogDescription>
              {editingNota?.estudianteNombre} · {editingNota?.evaluacionNombre}
            </DialogDescription>
          </DialogHeader>
          {editingNota && (
            <form onSubmit={handleGuardarDetalle} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nota</Label>
                <Input type="number" value={editingNota.valor} disabled />
                <p className="text-xs text-muted-foreground">
                  Para cambiar la nota, edítala directamente en la tabla.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observacion">Observación</Label>
                <Textarea
                  id="observacion"
                  name="observacion"
                  defaultValue={editingNota.observacion}
                  placeholder="Ej: Reprobado. Requiere refuerzo."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="respuestaEjemplo">Evidencia de respuesta (para análisis IA)</Label>
                <Textarea
                  id="respuestaEjemplo"
                  name="respuestaEjemplo"
                  defaultValue={editingNota.respuestaEjemplo}
                  placeholder="Pega aquí una respuesta del estudiante que evidencie el error o dificultad conceptual. La IA la usará para identificar la brecha."
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Esta evidencia permite a la IA identificar dificultades concretas y
                  generar ejercicios personalizados.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingNota(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardar.isPending} className="gap-2">
                  {guardar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Guardar detalle
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
