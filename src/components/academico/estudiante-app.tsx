'use client'

import { useState } from 'react'
import {
  GraduationCap, LayoutDashboard, ClipboardCheck, BrainCircuit, LogOut,
  Wand2, Loader2, Sparkles, History, BrainCircuit as Brain, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/session'
import { useDetalleEstudiante, useAnalisisIA, useEjecutarAnalisis } from '@/hooks/use-academic'
import { ThemeToggle } from './theme-toggle'
import { PerfilRendimiento } from './perfil-rendimiento'
import { ExamenEstudiante } from './examen-estudiante'
import { ResultadosAnalisis } from './brechas-panel'
import { LoadingState, EmptyState } from './shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { toast } from 'sonner'

type TabId = 'rendimiento' | 'evaluaciones' | 'brechas'

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'rendimiento', label: 'Mi rendimiento', icon: LayoutDashboard },
  { id: 'evaluaciones', label: 'Mis evaluaciones', icon: ClipboardCheck },
  { id: 'brechas', label: 'Mis brechas y refuerzo', icon: BrainCircuit },
]

export function EstudianteApp() {
  const { estudianteId, estudianteNombre, logout } = useSession()
  const [tab, setTab] = useState<TabId>('rendimiento')

  if (!estudianteId) return null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Hola, <span className="text-primary">{estudianteNombre}</span>
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Tu panel de aprendizaje</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary md:inline-flex">
              <GraduationCap className="size-3.5" />
              Estudiante
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl px-2 sm:px-6">
          <div className="scroll-academico -mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'group relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {tab === 'rendimiento' && <MiRendimiento estudianteId={estudianteId} />}
        {tab === 'evaluaciones' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Mis evaluaciones</h2>
              <p className="text-sm text-muted-foreground">Rinde las evaluaciones que el docente asignó. Se autocorrigen al enviar.</p>
            </div>
            <ExamenEstudiante estudianteId={estudianteId} estudianteNombre={estudianteNombre ?? ''} />
          </div>
        )}
        {tab === 'brechas' && <MisBrechas estudianteId={estudianteId} />}
      </main>

      <footer className="mt-auto border-t border-border/70 bg-muted/40">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>EduTrack IA · Tu panel personal de aprendizaje · Prototipo demostrativo</p>
          <p className="flex items-center gap-1.5">
            <BrainCircuit className="size-3.5 text-primary" />
            Refuerzo asistido por IA
          </p>
        </div>
      </footer>

      <Sonner position="bottom-right" />
    </div>
  )
}

// --- Pestaña: Mi rendimiento ---
function MiRendimiento({ estudianteId }: { estudianteId: string }) {
  const detalle = useDetalleEstudiante(estudianteId)

  if (detalle.isLoading) return <LoadingState label="Cargando tu rendimiento…" />
  if (detalle.isError || !detalle.data) {
    return <EmptyState icon={LayoutDashboard} title="Sin datos aún" description="Aún no tienes notas registradas." />
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Mi rendimiento</h2>
        <p className="text-sm text-muted-foreground">Tu promedio, nivel de riesgo, evolución y competencias.</p>
      </div>
      <PerfilRendimiento detalle={detalle.data} estudiante={detalle.data.estudiante} />
    </div>
  )
}

// --- Pestaña: Mis brechas y refuerzo ---
function MisBrechas({ estudianteId }: { estudianteId: string }) {
  const analisis = useAnalisisIA(estudianteId)
  const ejecutar = useEjecutarAnalisis()

  function handleAnalizar() {
    ejecutar.mutate(
      { estudianteId, materiaId: null },
      {
        onSuccess: () => toast.success('Análisis completado', { description: 'Revisa tus brechas y tu plan de refuerzo.' }),
        onError: (err: Error) => toast.error('Error en el análisis', { description: err.message }),
      }
    )
  }

  const ultimo = ejecutar.data ?? analisis.data?.analisis[0]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Mis brechas y plan de refuerzo</h2>
        <p className="text-sm text-muted-foreground">La IA analiza tus respuestas erróneas y te propone ejercicios personalizados.</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Análisis personalizado con IA</p>
          <p className="mt-1 text-sm text-muted-foreground">
            El modelo examina tus notas bajas y las evidencias de tus respuestas en las evaluaciones rendidas,
            identifica en qué temas tienes dificultades y genera un plan de refuerzo con ejercicios.
          </p>
        </div>
        <Button onClick={handleAnalizar} disabled={ejecutar.isPending} className="shrink-0 gap-2">
          {ejecutar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {ejecutar.isPending ? 'Analizando…' : 'Analizar con IA'}
        </Button>
      </div>

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
        <Card className="overflow-hidden border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Brain className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">La IA está analizando tus respuestas…</p>
              <p className="mt-1 text-sm text-muted-foreground">Identificando tus brechas y diseñando ejercicios.</p>
            </div>
          </CardContent>
        </Card>
      ) : ultimo ? (
        <ResultadosAnalisis analisis={ultimo} />
      ) : analisis.isLoading ? (
        <LoadingState label="Cargando análisis previos…" />
      ) : (
        <EmptyState
          icon={Brain}
          title="Aún no tienes un análisis"
          description="Pulsa «Analizar con IA» para que el modelo revise tus evaluaciones y te proponga un plan de refuerzo personalizado."
        />
      )}

      {analisis.data && analisis.data.analisis.length > 0 && !ejecutar.isPending && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Historial de análisis
            </CardTitle>
            <CardDescription>{analisis.data.analisis.length} análisis anteriores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {analisis.data.analisis.map((a) => (
                <AccordionItem key={a.id} value={a.id} className="rounded-xl border border-border/60 bg-card px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 pr-2 text-left">
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <Badge variant="secondary">
                        {a.resultado.brechas.length} brechas · {a.resultado.ejercicios.length} ejercicios
                      </Badge>
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
