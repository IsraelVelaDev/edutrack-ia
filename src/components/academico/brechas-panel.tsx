'use client'

import { useState } from 'react'
import {
  BrainCircuit, Sparkles, Target, Lightbulb, Dumbbell, AlertCircle,
  BookMarked, ArrowRight, History, Loader2, Wand2, Quote, CheckCircle2,
} from 'lucide-react'
import { useAcademicData, useAnalisisIA, useEjecutarAnalisis } from '@/hooks/use-academic'
import { SectionHeader, LoadingState, EmptyState, ProgressBar } from './shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { BrechaAprendizaje, EjercicioRefuerzo, RecomendacionIA } from '@/lib/types'

export function BrechasPanel() {
  const { data } = useAcademicData()
  const [estudianteId, setEstudianteId] = useState<string>('')
  const [materiaId, setMateriaId] = useState<string>('all')
  const ejecutar = useEjecutarAnalisis()

  // idActual seguro (opcional) — debe calcularse antes de cualquier return
  const idActual =
    estudianteId ||
    data?.riesgoGeneral?.[0]?.estudianteId ||
    data?.estudiantes?.[0]?.id ||
    ''
  const analisis = useAnalisisIA(idActual || null)

  if (!data) return null

  function handleAnalizar() {
    if (!idActual) {
      toast.error('Selecciona un estudiante')
      return
    }
    ejecutar.mutate(
      { estudianteId: idActual, materiaId: materiaId === 'all' ? null : materiaId },
      {
        onSuccess: () => {
          toast.success('Análisis completado', {
            description: 'La IA identificó brechas y generó un plan de refuerzo.',
          })
        },
        onError: (err: Error) => toast.error('Error en el análisis', { description: err.message }),
      }
    )
  }

  const estudianteSel = data.estudiantes.find((e) => e.id === idActual)
  const materiaSel = data.materias.find((m) => m.id === materiaId)

  // Análisis más reciente (ya sea el recién ejecutado o el último almacenado)
  const ultimoAnalisis = ejecutar.data ?? analisis.data?.analisis[0]

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Brechas de aprendizaje y plan de refuerzo"
        description="La IA analiza las calificaciones y evidencias de respuesta para identificar dificultades y proponer ejercicios personalizados."
        icon={BrainCircuit}
      />

      {/* Banner explicativo IA */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Análisis asistido por IA — no reemplaza la calificación oficial
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            El modelo de lenguaje examina las notas bajas y las evidencias de respuesta
            registradas (errores conceptuales visibles) para detectar brechas por tema y
            competencia. Luego genera recomendaciones y ejercicios de refuerzo. Las notas
            siguen calculándose con reglas deterministas.
          </p>
        </div>
      </div>

      {/* Selector + acción */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estudiante
              </label>
              <Select value={idActual} onValueChange={setEstudianteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {data.estudiantes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre} {e.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Materia (opcional)
              </label>
              <Select value={materiaId} onValueChange={setMateriaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las materias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las materias</SelectItem>
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
            </div>
            <Button
              onClick={handleAnalizar}
              disabled={ejecutar.isPending || !idActual}
              className="gap-2 sm:w-auto"
            >
              {ejecutar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {ejecutar.isPending ? 'Analizando…' : 'Analizar con IA'}
            </Button>
          </div>
          {estudianteSel && (
            <p className="mt-3 text-xs text-muted-foreground">
              Analizando: <span className="font-medium text-foreground">{estudianteSel.nombre} {estudianteSel.apellido}</span>
              {materiaSel ? <> · {materiaSel.nombre}</> : ' · todas las materias'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {ejecutar.isError ? (
        <Card className="border-rose-200 dark:border-rose-900">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No se pudo completar el análisis</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {ejecutar.error?.message ?? 'El modelo no respondió correctamente. Puedes reintentar.'}
              </p>
            </div>
            <Button onClick={handleAnalizar} variant="outline" className="gap-2">
              <Wand2 className="size-4" /> Reintentar análisis
            </Button>
          </CardContent>
        </Card>
      ) : ejecutar.isPending ? (
        <AnalizandoEstado />
      ) : ultimoAnalisis ? (
        <ResultadosAnalisis analisis={ultimoAnalisis} />
      ) : analisis.isLoading ? (
        <LoadingState label="Cargando análisis previos…" />
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="Aún no hay análisis para este estudiante"
          description="Pulsa «Analizar con IA» para que el modelo examine las calificaciones y evidencias, e identifique brechas de aprendizaje con un plan de refuerzo personalizado."
        />
      )}

      {/* Historial de análisis */}
      {analisis.data && analisis.data.analisis.length > 0 && !ejecutar.isPending && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Historial de análisis
            </CardTitle>
            <CardDescription>
              Análisis anteriores almacenados para este estudiante ({analisis.data.analisis.length}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {analisis.data.analisis.map((a) => (
                <AccordionItem key={a.id} value={a.id} className="rounded-xl border border-border/60 bg-card px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-3 pr-2 text-left">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {a.resultado.brechas.length} brechas · {a.resultado.recomendaciones.length} recomendaciones · {a.resultado.ejercicios.length} ejercicios
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}
                          {a.materiaId ? ` · ${data.materias.find((m) => m.id === a.materiaId)?.nombre ?? 'materia'}` : ' · todas las materias'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ResultadosAnalisis analisis={a} compacto />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Estado de análisis en progreso ---
function AnalizandoEstado() {
  const pasos = [
    'Recopilando calificaciones y evidencias…',
    'Identificando errores conceptuales por tema…',
    'Clasificando brechas por severidad…',
    'Generando recomendaciones de refuerzo…',
    'Diseñando ejercicios personalizados…',
  ]
  return (
    <Card className="overflow-hidden border-primary/30">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <BrainCircuit className="size-8" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">La IA está analizando…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Esto puede tomar unos segundos. El modelo examina cada evidencia de respuesta.
            </p>
          </div>
          <ul className="w-full max-w-md space-y-2 text-left">
            {pasos.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Visualización de resultados ---
export function ResultadosAnalisis({
  analisis,
  compacto = false,
}: {
  analisis: {
    id?: string
    createdAt?: string
    resultado: { brechas: BrechaAprendizaje[]; recomendaciones: RecomendacionIA[]; ejercicios: EjercicioRefuerzo[]; resumen: string }
  }
  compacto?: boolean
}) {
  const { resultado } = analisis
  const { brechas, recomendaciones, ejercicios, resumen } = resultado

  const sevColor = {
    alta: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
    media: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
    baja: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  }
  const prioColor = {
    alta: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    media: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    baja: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  }
  const difColor = {
    basico: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    intermedio: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    avanzado: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }
  const iconTipo: Record<string, React.ComponentType<{ className?: string }>> = {
    repaso: BookMarked,
    ejercicio: Dumbbell,
    recurso: BookMarked,
    estrategia: Lightbulb,
  }
  const labelTipo: Record<string, string> = {
    repaso: 'Repaso',
    ejercicio: 'Ejercicio',
    recurso: 'Recurso',
    estrategia: 'Estrategia',
  }
  const labelDif: Record<string, string> = {
    basico: 'Básico',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
  }

  return (
    <div className={cn('space-y-4', compacto && 'pt-2')}>
      {/* Resumen */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Resumen del análisis IA
            </p>
            <p className="mt-0.5 text-sm text-foreground">{resumen}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Brechas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4 text-rose-500" />
              Brechas de aprendizaje
              <Badge variant="secondary">{brechas.length}</Badge>
            </CardTitle>
            <CardDescription>Dificultades detectadas por tema y competencia.</CardDescription>
          </CardHeader>
          <CardContent>
            {brechas.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Sin brechas significativas" description="El estudiante no presenta dificultades relevantes en este momento." />
            ) : (
              <div className="scroll-academico max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {brechas.map((b, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{b.tema}</p>
                        <p className="text-xs text-muted-foreground">{b.competencia}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', sevColor[b.severidad])}>
                        {b.severidad}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{b.descripcion}</p>
                    {b.evidencia && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 p-2">
                        <Quote className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
                        <p className="text-xs italic text-muted-foreground">{b.evidencia}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-500" />
              Recomendaciones
              <Badge variant="secondary">{recomendaciones.length}</Badge>
            </CardTitle>
            <CardDescription>Acciones de refuerzo sugeridas por la IA.</CardDescription>
          </CardHeader>
          <CardContent>
            {recomendaciones.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Sin recomendaciones urgentes" />
            ) : (
              <ul className="scroll-academico max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {recomendaciones.map((r, i) => {
                  const Icon = iconTipo[r.tipo] ?? Lightbulb
                  return (
                    <li key={i} className="rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{r.titulo}</p>
                            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', prioColor[r.prioridad])}>
                              {r.prioridad} prioridad
                            </span>
                            <Badge variant="outline" className="text-[10px]">{labelTipo[r.tipo] ?? r.tipo}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{r.descripcion}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ejercicios de refuerzo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            Plan de ejercicios de refuerzo
            <Badge variant="secondary">{ejercicios.length}</Badge>
          </CardTitle>
          <CardDescription>Ejercicios personalizados para superar las brechas detectadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {ejercicios.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Sin ejercicios generados" description="No se requieren ejercicios de refuerzo en este momento." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ejercicios.map((ej, i) => (
                <div key={i} className="flex flex-col rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{ej.titulo}</p>
                      <p className="text-xs text-muted-foreground">Tema: {ej.tema}</p>
                    </div>
                    <span className={cn('shrink-0 rounded px-2 py-0.5 text-[10px] font-medium', difColor[ej.dificultad])}>
                      {labelDif[ej.dificultad] ?? ej.dificultad}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-foreground">{ej.enunciado}</p>
                  <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                    <Lightbulb className="size-3.5 shrink-0 translate-y-0.5 text-amber-500" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">Pista:</span> {ej.pista}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
