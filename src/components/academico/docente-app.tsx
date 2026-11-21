'use client'

import { useState } from 'react'
import {
  GraduationCap, LayoutDashboard, Users, ClipboardList, FileQuestion,
  AlertTriangle, BrainCircuit, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/session'
import { ThemeToggle } from './theme-toggle'
import { PanelGeneral } from './panel-general'
import { EstudiantesPanel } from './estudiantes-panel'
import { CalificacionesPanel } from './calificaciones-panel'
import { EvaluacionesDocente } from './evaluaciones-panel'
import { RiesgoPanel } from './riesgo-panel'
import { BrechasPanel } from './brechas-panel'
import { useAcademicData } from '@/hooks/use-academic'
import { LoadingState } from './shared'
import { Button } from '@/components/ui/button'
import { Toaster as Sonner } from '@/components/ui/sonner'

type TabId = 'panel' | 'estudiantes' | 'calificaciones' | 'evaluaciones' | 'riesgo' | 'brechas'

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'panel', label: 'Panel general', icon: LayoutDashboard },
  { id: 'estudiantes', label: 'Estudiantes', icon: Users },
  { id: 'calificaciones', label: 'Calificaciones', icon: ClipboardList },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: FileQuestion },
  { id: 'riesgo', label: 'Riesgo académico', icon: AlertTriangle },
  { id: 'brechas', label: 'Brechas y refuerzo', icon: BrainCircuit },
]

export function DocenteApp() {
  const { logout } = useSession()
  const [tab, setTab] = useState<TabId>('panel')
  const { isLoading, isError, refetch } = useAcademicData()

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
                EduTrack <span className="text-primary">IA</span>
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Panel del docente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary md:inline-flex">
              <GraduationCap className="size-3.5" />
              Docente
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 px-6 py-14 text-center dark:border-rose-900 dark:bg-rose-950/30">
            <p className="font-semibold text-rose-700 dark:text-rose-300">No se pudo cargar la información académica.</p>
            <Button onClick={() => refetch()} className="bg-rose-600 hover:bg-rose-700">Reintentar</Button>
          </div>
        ) : isLoading ? (
          <LoadingState label="Cargando información académica…" />
        ) : (
          <>
            {tab === 'panel' && <PanelGeneral />}
            {tab === 'estudiantes' && <EstudiantesPanel />}
            {tab === 'calificaciones' && <CalificacionesPanel />}
            {tab === 'evaluaciones' && <EvaluacionesDocente />}
            {tab === 'riesgo' && <RiesgoPanel />}
            {tab === 'brechas' && <BrechasPanel />}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-border/70 bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>EduTrack IA · Prototipo demostrativo con datos ficticios · No realiza cálculos oficiales de calificaciones.</p>
          <p className="flex items-center gap-1.5">
            <BrainCircuit className="size-3.5 text-primary" />
            Análisis de aprendizaje asistido por IA
          </p>
        </div>
      </footer>

      <Sonner position="bottom-right" />
    </div>
  )
}
