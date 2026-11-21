import { NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { db } from '@/lib/db'
import { aplicarCookie, crearToken, leerSesion, verificarPassword } from '@/lib/auth'

// Límite de intentos fallidos por clave (rol+código+IP): 5 intentos y bloqueo de 60 s.
const intentos = ((globalThis as unknown as { __intentos?: Map<string, { n: number; hasta: number }> }).__intentos ??=
  new Map())

const igual = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())

// GET /api/auth -> sesión actual (o null)
export async function GET(request: Request) {
  const s = leerSesion(request)
  return NextResponse.json({
    sesion: s ? { rol: s.rol, estudianteId: s.estudianteId, nombre: s.nombre } : null,
  })
}

// POST /api/auth { rol, codigo?, password } -> inicia sesión
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { rol, codigo, password } = body as { rol?: string; codigo?: string; password?: string }
  if ((rol !== 'docente' && rol !== 'estudiante') || typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Datos de acceso incompletos.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'local'
  const clave = `${rol}|${String(codigo ?? '').toLowerCase()}|${ip}`
  const reg = intentos.get(clave)
  const bloqueado = reg && reg.hasta > Date.now()
  if (reg && bloqueado && reg.n >= 5) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 })
  }
  const fallo = () => {
    const n = (bloqueado && reg ? reg.n : 0) + 1
    intentos.set(clave, { n, hasta: Date.now() + 60_000 })
    return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 })
  }

  let sesion: { rol: 'docente' | 'estudiante'; estudianteId: string | null; nombre: string }
  if (rol === 'docente') {
    const esperada = process.env.DOCENTE_PASSWORD
    if (!esperada || !igual(password, esperada)) return fallo()
    sesion = { rol: 'docente', estudianteId: null, nombre: 'Docente' }
  } else {
    const est = codigo ? await db.estudiante.findUnique({ where: { codigo: String(codigo) } }) : null
    const ok = verificarPassword(password, est?.passwordHash)
    if (!ok || !est) return fallo()
    sesion = { rol: 'estudiante', estudianteId: est.id, nombre: `${est.nombre} ${est.apellido}` }
  }
  intentos.delete(clave)
  return aplicarCookie(NextResponse.json({ sesion }), crearToken(sesion))
}

// DELETE /api/auth -> cierra sesión
export async function DELETE() {
  return aplicarCookie(NextResponse.json({ ok: true }), null)
}
