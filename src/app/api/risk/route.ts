import { NextResponse } from 'next/server'
import { autorizar, autorizarSobreEstudiante } from '@/lib/auth'
import { calcularRiesgoEstudiante, calcularRiesgoGeneralEstudiantes } from '@/lib/queries'

// GET /api/risk -> riesgo general de todos los estudiantes
// GET /api/risk?estudianteId=X -> detalle de riesgo de un estudiante (general + por materia)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const estudianteId = searchParams.get('estudianteId')

  // Detalle: docente (cualquiera) o estudiante (solo el propio). Listado general: solo docente.
  const a = estudianteId
    ? autorizarSobreEstudiante(request, estudianteId)
    : autorizar(request, ['docente'])
  if ('error' in a) return a.error

  if (estudianteId) {
    const detalle = await calcularRiesgoEstudiante(estudianteId)
    if (!detalle) {
      return NextResponse.json({ error: 'Estudiante no encontrado.' }, { status: 404 })
    }
    return NextResponse.json(detalle)
  }

  const riesgoGeneral = await calcularRiesgoGeneralEstudiantes()
  return NextResponse.json({ riesgoGeneral })
}
