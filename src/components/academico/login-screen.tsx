'use client'

import { useState } from 'react'
import { GraduationCap, BrainCircuit, LogIn, ArrowRight, Users, BookOpen } from 'lucide-react'
import { useSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Paso = 'rol' | 'docente' | 'estudiante'

export function LoginScreen() {
  const { login } = useSession()
  const [paso, setPaso] = useState<Paso>('rol')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  function volver() {
    setPaso('rol')
    setCodigo('')
    setPassword('')
    setError(null)
  }

  async function ingresar(e: React.FormEvent) {
    e.preventDefault()
    if (paso === 'rol') return
    setCargando(true)
    setError(null)
    try {
      await login(paso, password, paso === 'estudiante' ? codigo.trim() : undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  const tarjeta =
    'group flex w-full items-center gap-4 rounded-xl border border-border/70 bg-background p-4 text-left transition-all hover:border-primary hover:bg-primary/5'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            EduTrack <span className="text-primary">IA</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistema inteligente de calificaciones y aprendizaje
          </p>
        </div>

        {paso === 'rol' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
                ¿Con qué rol deseas ingresar?
              </p>
              <div className="space-y-3">
                <button onClick={() => setPaso('docente')} className={tarjeta}>
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Docente</p>
                    <p className="text-xs text-muted-foreground">
                      Gestiona estudiantes, calificaciones, evaluaciones y analiza el rendimiento del grupo.
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>

                <button onClick={() => setPaso('estudiante')} className={tarjeta}>
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Estudiante</p>
                    <p className="text-xs text-muted-foreground">
                      Consulta tu rendimiento, rinde evaluaciones y recibe tu plan de refuerzo personalizado con IA.
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </div>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <BrainCircuit className="size-3.5 text-primary" />
              Prototipo demostrativo · datos ficticios
            </p>
          </div>
        ) : (
          <form onSubmit={ingresar} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <button type="button" onClick={volver} className="text-sm text-muted-foreground hover:text-foreground">
              ← Volver
            </button>
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {paso === 'docente' ? <BookOpen className="size-6" /> : <Users className="size-6" />}
              </div>
              <p className="font-semibold text-foreground">
                Acceso de {paso === 'docente' ? 'docente' : 'estudiante'}
              </p>
            </div>
            <div className="space-y-3">
              {paso === 'estudiante' && (
                <div className="space-y-1.5">
                  <Label htmlFor="codigo">Código de estudiante</Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="EST-001"
                    autoComplete="username"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={cargando || !password} className="w-full gap-2">
                <LogIn className="size-4" />
                {cargando ? 'Verificando…' : 'Ingresar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
