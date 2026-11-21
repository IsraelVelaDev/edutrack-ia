import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

// --- Autenticación y autorización en el servidor ---
// La sesión es una cookie httpOnly firmada con HMAC-SHA256 (no manipulable desde el
// navegador). Cada ruta API valida rol e identidad; la UI solo refleja lo que el
// servidor ya autorizó.

export const COOKIE_SESION = 'edutrack_session'
const DURACION_SEG = 8 * 60 * 60

export type Rol = 'docente' | 'estudiante'
export interface Sesion {
  rol: Rol
  estudianteId: string | null
  nombre: string
  exp: number // epoch en segundos
}

function secreto(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Falta SESSION_SECRET (mínimo 32 caracteres) en .env.')
  return s
}

const firmar = (data: string) => createHmac('sha256', secreto()).update(data).digest('base64url')

export function crearToken(s: Omit<Sesion, 'exp'>): string {
  const payload = Buffer.from(
    JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + DURACION_SEG })
  ).toString('base64url')
  return `${payload}.${firmar(payload)}`
}

export function verificarToken(token: string | undefined): Sesion | null {
  if (!token) return null
  const [payload, firma] = token.split('.')
  if (!payload || !firma) return null
  const a = Buffer.from(firma)
  const b = Buffer.from(firmar(payload))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Sesion
    if (s.exp < Math.floor(Date.now() / 1000)) return null
    if (s.rol !== 'docente' && s.rol !== 'estudiante') return null
    return s
  } catch {
    return null
  }
}

export function aplicarCookie(res: NextResponse, token: string | null): NextResponse {
  res.cookies.set(COOKIE_SESION, token ?? '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: token ? DURACION_SEG : 0,
  })
  return res
}

export function leerSesion(request: Request): Sesion | null {
  const cookie = request.headers.get('cookie') ?? ''
  const m = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE_SESION}=`))
  return verificarToken(m?.slice(COOKIE_SESION.length + 1))
}

// --- Contraseñas (scrypt con sal) ---
export function hashPassword(password: string): string {
  const sal = randomBytes(16).toString('hex')
  return `scrypt$${sal}$${scryptSync(password, sal, 32).toString('hex')}`
}

export function verificarPassword(password: string, almacenado: string | null | undefined): boolean {
  // Se calcula siempre un hash para no revelar por tiempo si el usuario existe.
  const [alg, sal, hash] = (almacenado ?? 'scrypt$00$00').split('$')
  const calculado = scryptSync(password, sal ?? '00', 32)
  const esperado = Buffer.from(hash ?? '', 'hex')
  return alg === 'scrypt' && esperado.length === calculado.length && timingSafeEqual(calculado, esperado)
}

// --- Guardas para rutas API ---
const err = (status: number, error: string) => ({ error: NextResponse.json({ error }, { status }) })

// Defensa CSRF adicional a SameSite=Strict: en métodos que modifican, el Origin debe coincidir con el Host.
function origenValido(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}

/** Exige sesión válida con uno de los roles. Devuelve la sesión o la respuesta de error. */
export function autorizar(
  request: Request,
  roles: Rol[]
): { sesion: Sesion } | { error: NextResponse } {
  if (!origenValido(request)) return err(403, 'Origen no permitido.')
  const sesion = leerSesion(request)
  if (!sesion) return err(401, 'Sesión requerida. Inicia sesión.')
  if (!roles.includes(sesion.rol)) return err(403, 'No tienes permiso para esta acción.')
  return { sesion }
}

/** El docente accede a cualquier estudiante; el estudiante solo a sí mismo. */
export function autorizarSobreEstudiante(request: Request, estudianteId: string | null) {
  const a = autorizar(request, ['docente', 'estudiante'])
  if ('error' in a) return a
  if (a.sesion.rol === 'estudiante' && a.sesion.estudianteId !== estudianteId) {
    return err(403, 'Solo puedes acceder a tu propia información.')
  }
  return a
}
