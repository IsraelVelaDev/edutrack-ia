import { NextResponse } from 'next/server'
import { autorizar } from '@/lib/auth'
import { corregirExamen, guardarResultado } from '@/lib/exam'

// POST /api/responder
// Body: { estudianteId, evaluacionId, respuestas: { preguntaId: indiceSeleccionado } }
// Autocorrige, crea/actualiza la Nota (con evidencia) y la RespuestaEstudiante.
export async function POST(request: Request) {
  // Solo un estudiante rinde, y siempre como él mismo: el id sale de la sesión, no del cliente.
  const a = autorizar(request, ['estudiante'])
  if ('error' in a) return a.error
  const estudianteId = a.sesion.estudianteId as string
  try {
    const body = await request.json()
    const { evaluacionId, respuestas } = body as {
      evaluacionId: string
      respuestas: Record<string, number>
    }

    if (!evaluacionId || typeof respuestas !== 'object') {
      return NextResponse.json(
        { error: 'estudianteId, evaluacionId y respuestas son obligatorios.' },
        { status: 400 }
      )
    }

    const resultado = await corregirExamen(estudianteId, evaluacionId, respuestas)
    if (!resultado) {
      return NextResponse.json(
        { error: 'No se encontró la evaluación, el estudiante o las preguntas.' },
        { status: 404 }
      )
    }

    const guardado = await guardarResultado(estudianteId, evaluacionId, resultado)

    return NextResponse.json({
      notaId: guardado.notaId,
      puntaje: resultado.puntaje,
      correctas: resultado.correctas,
      total: resultado.total,
      observacion: resultado.observacion,
      detalle: resultado.detalle,
    })
  } catch (error) {
    console.error('Error al procesar respuestas:', error)
    return NextResponse.json({ error: 'Error interno al corregir.' }, { status: 500 })
  }
}
