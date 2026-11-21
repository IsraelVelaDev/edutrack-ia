'use client'

import { useState } from 'react'
import { Users, UserPlus, Search, GraduationCap, Info } from 'lucide-react'
import { useAcademicData, useCrearEstudiante } from '@/hooks/use-academic'
import { SectionHeader, RiskBadge, PromedioBadge, EmptyState } from './shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function EstudiantesPanel() {
  const { data } = useAcademicData()
  const crear = useCrearEstudiante()
  const [busqueda, setBusqueda] = useState('')
  const [open, setOpen] = useState(false)

  if (!data) return null

  const { estudiantes, riesgoGeneral, notas } = data

  // Mapa de riesgo por estudiante
  const riesgoPorId = new Map(riesgoGeneral.map((r) => [r.estudianteId, r]))

  const filtrados = estudiantes.filter((e) => {
    const q = busqueda.toLowerCase()
    return (
      e.nombre.toLowerCase().includes(q) ||
      e.apellido.toLowerCase().includes(q) ||
      e.codigo.toLowerCase().includes(q)
    )
  })

  function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const codigo = String(formData.get('codigo') || '').trim()
    const nombre = String(formData.get('nombre') || '').trim()
    const apellido = String(formData.get('apellido') || '').trim()
    const semestre = Number(formData.get('semestre') || 1)
    const carrera = String(formData.get('carrera') || '').trim()
    const password = String(formData.get('password') || '')

    crear.mutate(
      { codigo, nombre, apellido, semestre, carrera, password },
      {
        onSuccess: () => {
          toast.success('Estudiante registrado', {
            description: `${nombre} ${apellido} (${codigo}) agregado correctamente.`,
          })
          setOpen(false)
          ;(e.target as HTMLFormElement).reset()
        },
        onError: (err: Error) => {
          toast.error('No se pudo registrar', { description: err.message })
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Estudiantes"
        description="Consulta y registro del grupo académico."
        icon={Users}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="size-4" />
                Nuevo estudiante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar nuevo estudiante</DialogTitle>
                <DialogDescription>
                  Completa los datos del estudiante. Se creará sin notas; podrás
                  registrarlas en la pestaña Calificaciones.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCrear} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="codigo">Código</Label>
                    <Input id="codigo" name="codigo" placeholder="EST-009" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="semestre">Semestre</Label>
                    <Input id="semestre" name="semestre" type="number" min={1} max={12} defaultValue={2} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" name="nombre" placeholder="María" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input id="apellido" name="apellido" placeholder="Gómez" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="carrera">Carrera</Label>
                  <Input id="carrera" name="carrera" defaultValue="Ingeniería de Sistemas" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña inicial</Label>
                  <Input id="password" name="password" type="password" minLength={6} autoComplete="new-password" required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={crear.isPending}>
                    {crear.isPending ? 'Guardando…' : 'Registrar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="pl-9"
        />
      </div>

      {/* Lista de estudiantes */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          description={busqueda ? 'No se encontraron estudiantes con ese criterio.' : 'Aún no hay estudiantes registrados.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((e) => {
            const riesgo = riesgoPorId.get(e.id)
            const promedio = riesgo?.promedio ?? 0
            const totalNotasEst = notas.filter((n) => n.estudianteId === e.id).length
            return (
              <Card key={e.id} className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                      {e.nombre.charAt(0)}
                      {e.apellido.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {e.nombre} {e.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.codigo} · Sem. {e.semestre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {e.carrera}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      {totalNotasEst > 0 ? (
                        <PromedioBadge promedio={promedio} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin notas</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Riesgo</p>
                      {riesgo && riesgo.tieneDatos ? (
                        <RiskBadge nivel={riesgo.nivel} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin notas</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Nota informativa */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Info className="size-4" />
        </div>
        <p className="text-sm text-muted-foreground">
          El promedio y el riesgo se calculan automáticamente a partir de las notas
          registradas, usando <span className="font-medium text-foreground">reglas transparentes</span> (promedio
          ponderado, evaluaciones reprobadas, tendencia y peso de las evaluaciones). Las
          notas aprobatorias requieren <span className="font-medium text-foreground">51/100</span>.
        </p>
      </div>
    </div>
  )
}
