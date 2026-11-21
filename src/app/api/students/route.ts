import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autorizar, hashPassword } from '@/lib/auth'

// Crear un nuevo estudiante
export async function POST(request: Request) {
  const a = autorizar(request, ['docente'])
  if ('error' in a) return a.error
  try {
    const body = await request.json()
    const { codigo, nombre, apellido, semestre, carrera, password } = body

    if (!codigo || !nombre || !apellido || !carrera) {
      return NextResponse.json(
        { error: 'Código, nombre, apellido y carrera son obligatorios.' },
        { status: 400 }
      )
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña inicial es obligatoria (mínimo 6 caracteres).' },
        { status: 400 }
      )
    }

    const existente = await db.estudiante.findUnique({ where: { codigo } })
    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un estudiante con código ${codigo}.` },
        { status: 409 }
      )
    }

    const estudiante = await db.estudiante.create({
      data: {
        codigo,
        nombre,
        apellido,
        semestre: Number(semestre) || 1,
        carrera,
        passwordHash: hashPassword(password),
      },
      select: { id: true, codigo: true, nombre: true, apellido: true, semestre: true, carrera: true, createdAt: true },
    })

    return NextResponse.json(estudiante, { status: 201 })
  } catch (error) {
    console.error('Error al crear estudiante:', error)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
