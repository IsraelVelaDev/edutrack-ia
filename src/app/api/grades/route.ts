import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autorizar } from '@/lib/auth'

// Crear o actualizar (upsert) una nota por (estudianteId, evaluacionId)
export async function POST(request: Request) {
  const a = autorizar(request, ['docente'])
  if ('error' in a) return a.error
  try {
    const body = await request.json()
    const { estudianteId, evaluacionId, valor, observacion, respuestaEjemplo } = body

    if (!estudianteId || !evaluacionId || typeof valor !== 'number') {
      return NextResponse.json(
        { error: 'estudianteId, evaluacionId y valor numérico son obligatorios.' },
        { status: 400 }
      )
    }

    if (valor < 0 || valor > 100) {
      return NextResponse.json({ error: 'La nota debe estar entre 0 y 100.' }, { status: 400 })
    }

    // Buscar nota existente
    const existente = await db.nota.findFirst({
      where: { estudianteId, evaluacionId },
    })

    let nota
    if (existente) {
      nota = await db.nota.update({
        where: { id: existente.id },
        data: {
          valor,
          observacion: observacion ?? null,
          respuestaEjemplo: respuestaEjemplo ?? null,
        },
      })
    } else {
      nota = await db.nota.create({
        data: {
          estudianteId,
          evaluacionId,
          valor,
          observacion: observacion ?? null,
          respuestaEjemplo: respuestaEjemplo ?? null,
        },
      })
    }

    return NextResponse.json(nota, { status: existente ? 200 : 201 })
  } catch (error) {
    console.error('Error al guardar nota:', error)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
