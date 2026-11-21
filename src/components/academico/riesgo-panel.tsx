'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAcademicData, useDetalleEstudiante } from '@/hooks/use-academic'
import { SectionHeader, LoadingState, EmptyState } from './shared'
import { PerfilRendimiento } from './perfil-rendimiento'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function RiesgoPanel() {
  const { data } = useAcademicData()
  const [estudianteId, setEstudianteId] = useState<string>('')

  // idActual seguro (incluye default) — debe calcularse antes del hook
  const idActual =
    estudianteId ||
    data?.riesgoGeneral?.[0]?.estudianteId ||
    data?.estudiantes?.[0]?.id ||
    ''
  const detalle = useDetalleEstudiante(idActual || null)

  if (!data) return null

  const estudianteSeleccionado = data.estudiantes.find((e) => e.id === idActual)

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Riesgo académico"
        description="Predicción basada en reglas transparentes sobre calificaciones y su evolución."
        icon={AlertTriangle}
        action={
          <Select value={idActual} onValueChange={setEstudianteId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Seleccionar estudiante" />
            </SelectTrigger>
            <SelectContent>
              {data.estudiantes.map((e) => {
                const r = data.riesgoGeneral.find((x) => x.estudianteId === e.id)
                return (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre} {e.apellido}
                    {r?.nivel === 'alto' ? ' ⚠' : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        }
      />

      {detalle.isLoading ? (
        <LoadingState label="Analizando riesgo académico…" />
      ) : detalle.isError ? (
        <EmptyState icon={AlertTriangle} title="Error" description="No se pudo cargar el análisis de riesgo." />
      ) : detalle.data && estudianteSeleccionado ? (
        <PerfilRendimiento detalle={detalle.data} estudiante={estudianteSeleccionado} />
      ) : null}
    </div>
  )
}
