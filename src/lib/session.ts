import { create } from 'zustand'

// Estado de sesión SOLO de presentación. La fuente de verdad es la cookie httpOnly
// firmada que emite /api/auth; aquí se refleja lo que el servidor autorizó.
// Nada se guarda en localStorage: modificarlo desde el navegador no otorga acceso,
// porque cada ruta API valida la cookie por su cuenta.

type Rol = 'docente' | 'estudiante' | null

interface SesionServidor {
  rol: 'docente' | 'estudiante'
  estudianteId: string | null
  nombre: string
}

interface SessionState {
  role: Rol
  estudianteId: string | null
  estudianteNombre: string | null
  _hasHydrated: boolean
  cargar: () => Promise<void>
  login: (rol: 'docente' | 'estudiante', password: string, codigo?: string) => Promise<void>
  logout: () => Promise<void>
}

const aEstado = (s: SesionServidor | null) => ({
  role: s?.rol ?? null,
  estudianteId: s?.estudianteId ?? null,
  estudianteNombre: s && s.rol === 'estudiante' ? s.nombre : null,
})

export const useSession = create<SessionState>()((set) => ({
  role: null,
  estudianteId: null,
  estudianteNombre: null,
  _hasHydrated: false,
  cargar: async () => {
    try {
      const res = await fetch('/api/auth')
      const data = await res.json()
      set({ ...aEstado(data.sesion), _hasHydrated: true })
    } catch {
      set({ ...aEstado(null), _hasHydrated: true })
    }
  },
  login: async (rol, password, codigo) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol, password, codigo }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión.')
    set({ ...aEstado(data.sesion), _hasHydrated: true })
  },
  logout: async () => {
    await fetch('/api/auth', { method: 'DELETE' }).catch(() => {})
    set({ ...aEstado(null) })
    // Evita que datos del usuario anterior queden en la caché de TanStack Query.
    if (typeof window !== 'undefined') window.location.reload()
  },
}))
