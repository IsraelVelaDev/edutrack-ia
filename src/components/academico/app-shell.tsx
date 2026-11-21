'use client'

import { useEffect } from 'react'
import { useSession } from '@/lib/session'
import { LoginScreen } from '@/components/academico/login-screen'
import { DocenteApp } from '@/components/academico/docente-app'
import { EstudianteApp } from '@/components/academico/estudiante-app'
import { LoadingState } from '@/components/academico/shared'

export function AppShell() {
  const { role, _hasHydrated, cargar } = useSession()

  // La sesión se consulta al servidor (cookie httpOnly); no hay estado confiable en el cliente.
  useEffect(() => {
    cargar()
  }, [cargar])

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Cargando EduTrack IA…" />
      </div>
    )
  }

  if (!role) return <LoginScreen />
  if (role === 'docente') return <DocenteApp />
  if (role === 'estudiante') return <EstudianteApp />
  return null
}
