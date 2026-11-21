'use client'

import { useState } from 'react'
import {
  FileQuestion, Plus, BookOpen, ListChecks, Loader2, ClipboardCheck, CheckCircle2,
} from 'lucide-react'
import {
  useAcademicData, useBancoPreguntas, useEvaluacionesCreadas, useCrearEvaluacion,
} from '@/hooks/use-academic'
import { SectionHeader, LoadingState, EmptyState } from './shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Panel del DOCENTE: crea evaluaciones desde el banco de preguntas.
// (La rendición de evaluaciones por el estudiante vive en su propio panel.)
export function EvaluacionesDocente() {
  const { data } = useAcademicData()
  const [materiaId, setMateriaId] = useState<string>('')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [nombre, setNombre] = useState('')
  const [peso, setPeso] = useState('25')
  const banco = useBancoPreguntas(materiaId || null)
  const crear = useCrearEvaluacion()
  const creadas = useEvaluacionesCreadas()

  if (!data) return null

  const materiaActual = materiaId ? data.materias.find((m) => m.id === materiaId) : null

  function toggle(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCrear() {
    if (!materiaId) { toast.error('Selecciona una materia'); return }
    if (!nombre.trim()) { toast.error('Escribe un nombre para la evaluación'); return }
    if (seleccionadas.size === 0) { toast.error('Selecciona al menos una pregunta'); return }
    crear.mutate(
      { materiaId, nombre: nombre.trim(), peso: Number(peso) || 25, preguntaIds: [...seleccionadas] },
      {
        onSuccess: () => {
          toast.success('Evaluación creada', {
            description: `${seleccionadas.size} preguntas · peso ${peso}% · lista para que los estudiantes la rindan.`,
          })
          setNombre('')
          setSeleccionadas(new Set())
        },
        onError: (err: Error) => toast.error('Error', { description: err.message }),
      }
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Evaluaciones con banco de preguntas"
        description="Arma una evaluación seleccionando preguntas del banco. Los estudiantes la rendirán desde su panel."
        icon={FileQuestion}
      />

      {/* Selección de materia + datos de la evaluación */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Materia</Label>
              <Select value={materiaId} onValueChange={(v) => { setMateriaId(v); setSeleccionadas(new Set()) }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar materia" /></SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nombre de la evaluación</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Control de medio término" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Peso (%)</Label>
              <Input type="number" min={1} max={100} value={peso} onChange={(e) => setPeso(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banco de preguntas */}
      {!materiaId ? (
        <EmptyState icon={BookOpen} title="Selecciona una materia" description="Para mostrar el banco de preguntas disponible." />
      ) : banco.isLoading ? (
        <LoadingState label="Cargando banco de preguntas…" />
      ) : banco.data && banco.data.preguntas.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ListChecks className="size-4 text-primary" />
                Banco de preguntas — {materiaActual?.nombre}
              </h3>
              <p className="text-xs text-muted-foreground">{banco.data.preguntas.length} preguntas disponibles. Marca las que incluirás.</p>
            </div>
            <Badge className="gap-1" variant={seleccionadas.size > 0 ? 'default' : 'secondary'}>
              {seleccionadas.size} seleccionada{seleccionadas.size === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="grid gap-2.5">
            {banco.data.preguntas.map((p, i) => {
              const checked = seleccionadas.has(p.id)
              return (
                <label
                  key={p.id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30',
                    checked ? 'border-primary ring-1 ring-primary/30' : 'border-border/60'
                  )}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{i + 1}. {p.enunciado}</p>
                      <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{p.dificultad}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      <Badge variant="secondary" className="gap-1">{p.tema}</Badge>
                      <Badge variant="secondary" className="gap-1">{p.competencia}</Badge>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {p.opciones.map((op, idx) => (
                        <li key={idx} className={cn(
                          'flex items-center gap-2 text-xs',
                          idx === p.correcta ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                        )}>
                          <span className="size-4 rounded border border-current/30 text-center text-[9px] leading-[14px]">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {op}
                          {idx === p.correcta && <CheckCircle2 className="size-3" />}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{seleccionadas.size}</span> pregunta{seleccionadas.size === 1 ? '' : 's'} · peso {peso}%
            </p>
            <Button onClick={handleCrear} disabled={crear.isPending || seleccionadas.size === 0} className="gap-2">
              {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear evaluación
            </Button>
          </div>
        </>
      ) : (
        <EmptyState icon={FileQuestion} title="Sin preguntas" description="Esta materia aún no tiene preguntas en el banco." />
      )}

      {/* Evaluaciones ya creadas */}
      <div className="pt-2">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardCheck className="size-4 text-primary" />
          Evaluaciones creadas
        </h3>
        {creadas.isLoading ? (
          <LoadingState label="Cargando…" />
        ) : creadas.data && creadas.data.evaluaciones.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {creadas.data.evaluaciones.map((e) => (
              <Card key={e.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{e.nombre}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: e.materia.color }} />
                        {e.materia.nombre} · peso {e.peso}%
                      </p>
                    </div>
                    <Badge variant="secondary">{e.totalPreguntas} preg.</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tema: {e.tema}</span>
                    <span>{e.rendidaPor.length} rendida{e.rendidaPor.length === 1 ? '' : 's'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            Aún no se han creado evaluaciones desde el banco.
          </p>
        )}
      </div>
    </div>
  )
}
