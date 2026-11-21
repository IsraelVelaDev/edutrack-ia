'use client'

import { useState } from 'react'
import {
  ClipboardCheck, ChevronRight, CheckCircle2, ArrowLeft, Send, Loader2,
  ListChecks, Info, XCircle, Sparkles,
} from 'lucide-react'
import {
  useEvaluacionesCreadas, useResponderExamen,
  type EvaluacionCreada, type ResultadoExamenRespuesta,
} from '@/hooks/use-academic'
import { LoadingState, EmptyState } from './shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Componente reutilizable: flujo completo de rendir una evaluación.
// Recibe el estudiante por props (lo usa el panel del estudiante).
export function ExamenEstudiante({
  estudianteId,
  estudianteNombre,
}: {
  estudianteId: string
  estudianteNombre: string
}) {
  const creadas = useEvaluacionesCreadas()
  const [evaluacionSel, setEvaluacionSel] = useState<EvaluacionCreada | null>(null)
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [resultado, setResultado] = useState<ResultadoExamenRespuesta | null>(null)
  const responder = useResponderExamen()

  function iniciar(e: EvaluacionCreada) {
    setEvaluacionSel(e)
    setRespuestas({})
    setResultado(null)
  }
  function salir() {
    setEvaluacionSel(null)
    setResultado(null)
    setRespuestas({})
  }
  function handleEnviar() {
    if (!evaluacionSel) return
    responder.mutate(
      { estudianteId, evaluacionId: evaluacionSel.id, respuestas },
      {
        onSuccess: (r) => {
          setResultado(r)
          toast.success('Evaluación enviada', {
            description: `Puntaje: ${r.puntaje}/100 · ${r.correctas}/${r.total} correctas.`,
          })
        },
        onError: (err: Error) => toast.error('Error', { description: err.message }),
      }
    )
  }

  // --- FASE RESULTADO ---
  if (resultado && evaluacionSel) {
    return <PantallaResultado resultado={resultado} evaluacion={evaluacionSel} estudianteNombre={estudianteNombre} onSalir={salir} />
  }

  // --- FASE EXAMEN ---
  if (evaluacionSel) {
    const respondidas = Object.keys(respuestas).length
    const todas = respondidas === evaluacionSel.preguntas.length
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button onClick={salir} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver
          </button>
          <Badge variant="secondary" className="gap-1">
            <span className="size-2 rounded-full" style={{ background: evaluacionSel.materia.color }} />
            {evaluacionSel.materia.nombre}
          </Badge>
        </div>

        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{evaluacionSel.nombre}</CardTitle>
            <CardDescription>
              {evaluacionSel.preguntas.length} preguntas · peso {evaluacionSel.peso}% · estudiante: {estudianteNombre}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {evaluacionSel.preguntas.map((p, i) => (
            <Card key={p.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{i + 1}. {p.enunciado}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{p.dificultad}</Badge>
                </div>
                <div className="mt-1 mb-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{p.tema}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{p.competencia}</Badge>
                </div>
                <div className="space-y-2">
                  {p.opciones.map((op, idx) => {
                    const sel = respuestas[p.id] === idx
                    return (
                      <button
                        key={idx}
                        onClick={() => setRespuestas((prev) => ({ ...prev, [p.id]: idx }))}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                          sel ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border/60 hover:bg-muted/40'
                        )}
                      >
                        <span className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                          sel ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={sel ? 'font-medium text-foreground' : 'text-foreground'}>{op}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{respondidas}</span>/{evaluacionSel.preguntas.length} respondidas
          </p>
          <Button onClick={handleEnviar} disabled={responder.isPending || !todas} className="gap-2">
            {responder.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar respuestas
          </Button>
        </div>
      </div>
    )
  }

  // --- FASE LISTA ---
  if (creadas.isLoading) return <LoadingState label="Cargando evaluaciones…" />
  if (!creadas.data || creadas.data.evaluaciones.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No tienes evaluaciones disponibles"
        description="Cuando el docente cree una evaluación desde el banco, aparecerá aquí para que la rindas."
      />
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ClipboardCheck className="size-4 text-primary" />
        Evaluaciones disponibles para rendir
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {creadas.data.evaluaciones.map((e) => {
          const yaRindio = e.rendidaPor.includes(estudianteId)
          return (
            <Card key={e.id} className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{e.nombre}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: e.materia.color }} />
                      {e.materia.nombre}
                    </p>
                  </div>
                  {yaRindio && <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3" /> Rendida</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{e.totalPreguntas} preguntas</span>
                  <span>·</span>
                  <span>peso {e.peso}%</span>
                  <span>·</span>
                  <span>{e.tema}</span>
                </div>
                <Button onClick={() => iniciar(e)} className="mt-3 w-full gap-2" size="sm" variant={yaRindio ? 'outline' : 'default'}>
                  {yaRindio ? 'Volver a rendir' : 'Rendir evaluación'}
                  <ChevronRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// --- Pantalla de resultados ---
function PantallaResultado({
  resultado, evaluacion, estudianteNombre, onSalir,
}: {
  resultado: ResultadoExamenRespuesta
  evaluacion: EvaluacionCreada
  estudianteNombre: string
  onSalir: () => void
}) {
  const { puntaje, correctas, total, detalle } = resultado
  const aprobado = puntaje >= 51
  return (
    <div className="space-y-5">
      <Card className={cn('overflow-hidden border-2', aprobado ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30')}>
        <CardContent className="p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn('flex size-14 items-center justify-center rounded-2xl', aprobado ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400')}>
              {aprobado ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{estudianteNombre} · {evaluacion.nombre}</p>
              <p className="text-4xl font-bold tabular-nums text-foreground">{puntaje}<span className="text-lg text-muted-foreground">/100</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{correctas} de {total} respuestas correctas · {aprobado ? 'aprobado' : 'reprobado'}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary/10 p-3">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-foreground">
              La nota y el detalle de tus errores se guardaron automáticamente. La IA puede analizar ahora
              <span className="font-medium"> tus respuestas erróneas</span> para identificar brechas y proponerte ejercicios.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListChecks className="size-4 text-primary" />
          Revisión de respuestas
        </h3>
        <div className="space-y-3">
          {detalle.map((d, i) => (
            <Card key={d.preguntaId} className={cn('border-l-4', d.esCorrecta ? 'border-l-emerald-400 dark:border-l-emerald-600' : 'border-l-rose-400 dark:border-l-rose-600')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{i + 1}. {d.enunciado}</p>
                  {d.esCorrecta ? (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="size-3" /> Correcta</Badge>
                  ) : (
                    <Badge className="gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"><XCircle className="size-3" /> Incorrecta</Badge>
                  )}
                </div>
                <div className="mt-1 mb-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{d.tema}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{d.competencia}</Badge>
                </div>
                {!d.esCorrecta && (
                  <div className="mt-2 space-y-1.5 rounded-lg bg-rose-50 p-2.5 text-xs dark:bg-rose-950/30">
                    <p className="text-rose-700 dark:text-rose-300">
                      Tu respuesta: <span className="font-medium">{d.seleccionada !== null ? d.opciones[d.seleccionada] : '(sin responder)'}</span>
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      Correcta: <span className="font-medium">{d.opciones[d.correcta]}</span>
                    </p>
                  </div>
                )}
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 p-2.5">
                  <Info className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{d.explicacion}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onSalir} variant="outline" className="gap-2">
          <ArrowLeft className="size-4" /> Volver a evaluaciones
        </Button>
      </div>
    </div>
  )
}
