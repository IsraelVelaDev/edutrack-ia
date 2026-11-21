'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ResultadoAnalisisIA } from '@/lib/types'

// --- Tipos de respuesta de la API ---

export interface DashboardData {
  materias: {
    id: string
    codigo: string
    nombre: string
    semestre: number
    color: string
    descripcion: string
    evaluaciones: {
      id: string
      nombre: string
      peso: number
      tema: string
      competencia: string
      fecha: string
    }[]
  }[]
  estudiantes: {
    id: string
    codigo: string
    nombre: string
    apellido: string
    semestre: number
    carrera: string
  }[]
  notas: {
    id: string
    estudianteId: string
    evaluacionId: string
    valor: number
    observacion: string | null
    respuestaEjemplo: string | null
  }[]
  riesgoGeneral: {
    estudianteId: string
    estudianteNombre: string
    materiaId: string | null
    materiaNombre: string | null
    materiaColor: string | null
    promedio: number
    nivel: 'bajo' | 'medio' | 'alto'
    puntaje: number
    factores: { tipo: string; descripcion: string; evidencia: string }[]
    reprobadas: number
    totalEvaluaciones: number
    tieneDatos: boolean
  }[]
  resumen: {
    totalEstudiantes: number
    totalMaterias: number
    totalEvaluaciones: number
    totalNotas: number
    promedioGeneral: number
    distribucionRiesgo: { alto: number; medio: number; bajo: number }
    aprobadas: number
    reprobadas: number
    promedioPorMateria: {
      id: string
      nombre: string
      color: string
      promedio: number
      totalNotas: number
    }[]
  }
}

export interface DetalleEstudiante {
  estudiante: {
    id: string
    codigo: string
    nombre: string
    apellido: string
    semestre: number
    carrera: string
  }
  notas: {
    id: string
    valor: number
    observacion: string | null
    respuestaEjemplo: string | null
    evaluacion: {
      id: string
      nombre: string
      peso: number
      tema: string
      competencia: string
    }
    materia: { id: string; nombre: string; color: string; codigo: string }
  }[]
  riesgoGeneral: {
    estudianteId: string
    estudianteNombre: string
    materiaId: string | null
    materiaNombre: string | null
    materiaColor: string | null
    promedio: number
    nivel: 'bajo' | 'medio' | 'alto'
    puntaje: number
    factores: { tipo: string; descripcion: string; evidencia: string }[]
    reprobadas: number
    totalEvaluaciones: number
    tieneDatos: boolean
  }
  riesgoPorMateria: {
    estudianteId: string
    estudianteNombre: string
    materiaId: string | null
    materiaNombre: string | null
    materiaColor: string | null
    promedio: number
    nivel: 'bajo' | 'medio' | 'alto'
    puntaje: number
    factores: { tipo: string; descripcion: string; evidencia: string }[]
    reprobadas: number
    totalEvaluaciones: number
    tieneDatos: boolean
  }[]
}

export interface AnalisisGuardado {
  id: string
  estudianteId: string
  materiaId: string | null
  createdAt: string
  resultado: ResultadoAnalisisIA
}

// --- Hooks ---

export function useAcademicData() {
  return useQuery<DashboardData>({
    queryKey: ['academic-data'],
    queryFn: async () => {
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('No se pudo cargar la información académica.')
      return res.json()
    },
  })
}

export function useDetalleEstudiante(estudianteId: string | null) {
  return useQuery<DetalleEstudiante>({
    queryKey: ['detalle-estudiante', estudianteId],
    queryFn: async () => {
      const res = await fetch(`/api/risk?estudianteId=${estudianteId}`)
      if (!res.ok) throw new Error('No se pudo cargar el detalle del estudiante.')
      return res.json()
    },
    enabled: !!estudianteId,
  })
}

export function useAnalisisIA(estudianteId: string | null) {
  return useQuery<{ analisis: AnalisisGuardado[] }>({
    queryKey: ['analisis-ia', estudianteId],
    queryFn: async () => {
      const res = await fetch(`/api/ai-analysis?estudianteId=${estudianteId}`)
      if (!res.ok) throw new Error('No se pudieron cargar los análisis.')
      return res.json()
    },
    enabled: !!estudianteId,
  })
}

export function useCrearEstudiante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      codigo: string
      nombre: string
      apellido: string
      semestre: number
      carrera: string
      password: string
    }) => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear estudiante.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-data'] })
    },
  })
}

export function useGuardarNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      estudianteId: string
      evaluacionId: string
      valor: number
      observacion?: string
      respuestaEjemplo?: string
    }) => {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar la nota.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-data'] })
      qc.invalidateQueries({ queryKey: ['detalle-estudiante'] })
    },
  })
}

export function useEjecutarAnalisis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { estudianteId: string; materiaId?: string | null }) => {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al ejecutar el análisis.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analisis-ia'] })
      qc.invalidateQueries({ queryKey: ['academic-data'] })
    },
  })
}

// --- Banco de preguntas y evaluaciones ---

export interface PreguntaBanco {
  id: string
  materiaId: string
  materiaNombre: string
  materiaColor: string
  tema: string
  competencia: string
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string
  dificultad: 'basico' | 'intermedio' | 'avanzado'
}

export function useBancoPreguntas(materiaId: string | null) {
  return useQuery<{ preguntas: PreguntaBanco[] }>({
    queryKey: ['banco', materiaId],
    queryFn: async () => {
      const url = materiaId ? `/api/banco?materiaId=${materiaId}` : '/api/banco'
      const res = await fetch(url)
      if (!res.ok) throw new Error('No se pudo cargar el banco de preguntas.')
      return res.json()
    },
  })
}

export interface EvaluacionCreada {
  id: string
  nombre: string
  peso: number
  tema: string
  competencia: string
  fecha: string
  materia: { id: string; nombre: string; color: string; codigo: string }
  totalPreguntas: number
  preguntas: {
    id: string
    orden: number
    tema: string
    competencia: string
    enunciado: string
    opciones: string[]
    dificultad: string
  }[]
  rendidaPor: string[]
  createdAt: string
}

export function useEvaluacionesCreadas() {
  return useQuery<{ evaluaciones: EvaluacionCreada[] }>({
    queryKey: ['evaluaciones-creadas'],
    queryFn: async () => {
      const res = await fetch('/api/evaluaciones')
      if (!res.ok) throw new Error('No se pudieron cargar las evaluaciones.')
      return res.json()
    },
  })
}

export function useCrearEvaluacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      materiaId: string
      nombre: string
      peso: number
      preguntaIds: string[]
    }) => {
      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear la evaluación.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluaciones-creadas'] })
      qc.invalidateQueries({ queryKey: ['academic-data'] })
    },
  })
}

export interface ResultadoExamenRespuesta {
  notaId: string
  puntaje: number
  correctas: number
  total: number
  observacion: string
  detalle: {
    preguntaId: string
    enunciado: string
    tema: string
    competencia: string
    seleccionada: number | null
    correcta: number
    esCorrecta: boolean
    opciones: string[]
    explicacion: string
  }[]
}

export function useResponderExamen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      estudianteId: string
      evaluacionId: string
      respuestas: Record<string, number>
    }): Promise<ResultadoExamenRespuesta> => {
      const res = await fetch('/api/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al procesar las respuestas.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluaciones-creadas'] })
      qc.invalidateQueries({ queryKey: ['academic-data'] })
      qc.invalidateQueries({ queryKey: ['detalle-estudiante'] })
      qc.invalidateQueries({ queryKey: ['analisis-ia'] })
    },
  })
}
