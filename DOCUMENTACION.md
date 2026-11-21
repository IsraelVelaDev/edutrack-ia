# EduTrack IA — Sistema Inteligente de Calificaciones y Aprendizaje Universitario

> Prototipo funcional para feria de proyectos universitarios. Sistema web de calificaciones que incorpora inteligencia artificial como apoyo para analizar evidencias de aprendizaje, detectar brechas por tema/competencia y generar planes de refuerzo personalizados.

---

## Tabla de contenidos

1. [Objetivo del proyecto](#1-objetivo-del-proyecto)
2. [Principios de diseño](#2-principios-de-diseño)
3. [Tecnologías utilizadas](#3-tecnologías-utilizadas)
4. [Arquitectura general](#4-arquitectura-general)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Funcionalidades](#6-funcionalidades)
7. [Predicción de riesgo académico (reglas transparentes)](#7-predicción-de-riesgo-académico-reglas-transparentes)
8. [Detección de brechas de aprendizaje con IA](#8-detección-de-brechas-de-aprendizaje-con-ia)
9. [Flujo end-to-end del docente y el estudiante](#9-flujo-end-to-end-del-docente-y-el-estudiante)
10. [Estructura de archivos](#10-estructura-de-archivos)
11. [API REST](#11-api-rest)
12. [Cómo ejecutar el proyecto](#12-cómo-ejecutar-el-proyecto)
13. [Alcance y limitaciones](#13-alcance-y-limitaciones)
14. [Decisiones de diseño y UX](#14-decisiones-de-diseño-y-ux)
15. [Seguridad y control de acceso](#15-seguridad-y-control-de-acceso)
16. [Verificación y evidencias reproducibles](#16-verificación-y-evidencias-reproducibles)
17. [Limitaciones conocidas y trabajo pendiente](#17-limitaciones-conocidas-y-trabajo-pendiente)

---

## 1. Objetivo del proyecto

**EduTrack IA** es un prototipo demostrativo que muestra cómo un sistema universitario de calificaciones puede ir más allá del registro de notas: ayuda a **comprender las dificultades de aprendizaje** de cada estudiante y **propone acciones concretas** para mejorar su rendimiento.

### Contexto
- Pensado para una **feria de proyectos universitarios**.
- Usa **datos ficticios** (8 estudiantes, 4 materias, 16 evaluaciones, 128 notas).
- No es un producto comercial ni una plataforma institucional completa.

### Lo que la demostración evidencia
1. **Registrar y consultar** el rendimiento de un estudiante.
2. **Detectar posibles dificultades académicas** (riesgo) con reglas transparentes.
3. **Visualizar las competencias débiles** de cada estudiante y del grupo.
4. **Generar un plan de refuerzo asistido por IA** a partir de las respuestas erróneas.

### Frontera clara del rol de la IA
La IA **no calcula notas oficiales**. Las calificaciones se calculan con reglas deterministas y auditables. La IA actúa solo como **apoyo para analizar evidencias de aprendizaje** (respuestas de ejemplo con errores conceptuales) y generar recomendaciones/ejercicios. Esta separación es deliberada y central para la propuesta.

---

## 2. Principios de diseño

| Principio | Aplicación |
|---|---|
| **IA de apoyo, no de decisión** | El modelo analiza evidencias y propone refuerzo; las notas y el riesgo se calculan con reglas deterministas. |
| **Reglas transparentes** | El riesgo se explica con factores concretos y evidencia (no es una caja negra). |
| **Datos ficticios realistas** | Perfiles variados: un estudiante con riesgo alto general, otro débil solo en una materia, etc. |
| **Interfaz moderna e intuitiva** | Tema académico emerald/teal, claro/oscuro, responsive, footer sticky. |
| **Implementación sencilla y coherente** | Solo lo necesario para una demo convincente; sin características innecesarias. |

---

## 3. Tecnologías utilizadas

### Núcleo (no negociable)
- **Next.js 16** con App Router y Turbopack.
- **TypeScript 5** estricto en todo el código.

### Frontend
- **Tailwind CSS 4** para estilos.
- **shadcn/ui** (estilo *New York*) — componentes accesibles sobre Radix UI.
- **Lucide React** — iconografía.
- **recharts** — gráficos (barras, donut, radar).
- **framer-motion** — transiciones sutiles.
- **next-themes** — modo claro/oscuro.

### Estado y datos
- **Prisma ORM** (cliente SQLite) + **Prisma Client** — base de datos local.
- **TanStack Query (React Query)** — estado del servidor (caché, invalidación).
- **Zustand** — estado de presentación de la sesión (sin persistencia; la fuente de verdad es la cookie del servidor, ver §15).

### Inteligencia artificial
- **OpenRouter** (API de chat completions) con el modelo `google/gemini-2.5-flash` (configurable con `OPENROUTER_MODEL`), temperatura 0,3, máximo 1200 tokens de salida y razonamiento desactivado. Se usa exclusivamente en el backend (`src/lib/ai.ts`), nunca en el cliente.

### Utilidades
- **react-hook-form** + **zod** + **@hookform/resolvers** — formularios y validación.
- **sonner** — notificaciones (toasts).
- **date-fns** — fechas.
- **tsx** — ejecución de los scripts de verificación (`scripts/`).

> La app expone una sola ruta visible (`/`) con navegación por pestañas. La separación de roles (docente / estudiante) la **impone el servidor** en cada ruta API mediante una cookie de sesión firmada (§15); la interfaz solo refleja lo ya autorizado.

---

## 4. Arquitectura general

```
┌──────────────────────────────────────────────────────────────┐
│  Ruta única /  (App Router)                                   │
│  src/app/page.tsx → AppShell                                  │
│                                                               │
│  AppShell consulta la sesión al servidor (GET /api/auth):    │
│    • sin sesión  → LoginScreen (rol docente / estudiante)     │
│    • docente      → DocenteApp (6 pestañas de gestión)         │
│    • estudiante   → EstudianteApp (3 pestañas personales)      │
└──────────────────────────────────────────────────────────────┘
        │                                   │
        ▼                                   ▼
┌─────────────────────────┐   ┌──────────────────────────────┐
│  TanStack Query (hooks) │   │  API Routes (backend)         │
│  src/hooks/use-academic  │   │  src/app/api/*                │
│  - useAcademicData       │   │  - /api/data, /api/risk       │
│  - useDetalleEstudiante  │◄──┤  - /api/students, /api/grades │
│  - useAnalisisIA         │   │  - /api/ai-analysis           │
│  - useBancoPreguntas…    │   │  - /api/banco, /api/evaluacio.│
└─────────────────────────┘   │    /api/responder              │
        │                     └──────────────────────────────┘
        ▼                                   │
┌─────────────────────────┐                 ▼
│  Lógica de dominio      │   ┌──────────────────────────────┐
│  src/lib/               │   │  Prisma (SQLite)             │
│  - risk.ts   (riesgo)    │   │  8 modelos (ver §5)           │
│  - ai.ts     (IA)        │   └──────────────────────────────┘
│  - exam.ts   (autocorr.) │                 │
│  - queries.ts            │                 ▼
│  - auth.ts   (sesión/roles)│
│  - session.ts (estado UI) │   ┌──────────────────────────────┐
│  - types.ts              │   │  OpenRouter (LLM)             │
└─────────────────────────┘   │  solo en /api/ai-analysis     │
                              └──────────────────────────────┘
```

**Capas:**
1. **Presentación** — componentes React en `src/components/academico/`, con shadcn/ui.
2. **Hooks de datos** — `src/hooks/use-academic.ts` (TanStack Query).
3. **API** — rutas en `src/app/api/` (Next.js Route Handlers).
4. **Dominio** — `src/lib/` (cálculo de riesgo, IA, autocorrección, consultas, sesión, tipos).
5. **Persistencia** — Prisma + SQLite (`prisma/schema.prisma`, `src/lib/db.ts`).

---

## 5. Modelo de datos

Esquema Prisma (SQLite). 8 modelos:

### Núcleo académico
| Modelo | Descripción | Campos clave |
|---|---|---|
| **Estudiante** | Alumno del grupo | `codigo` (único), `nombre`, `apellido`, `semestre`, `carrera`, `passwordHash` (scrypt; nunca se expone por la API) |
| **Materia** | Asignatura | `codigo` (único), `nombre`, `semestre`, `color` (hex), `descripcion` |
| **Evaluacion** | Evaluación de una materia | `materiaId`, `nombre`, `peso` (%), `tema`, `competencia`, `fecha`, `esDeBanco` (bool, si se creó desde el banco) |
| **Nota** | Calificación | `estudianteId`, `evaluacionId`, `valor` (0–100), `observacion`, `respuestaEjemplo` (evidencia para IA) |

### Banco de preguntas y rendición
| Modelo | Descripción | Campos clave |
|---|---|---|
| **Pregunta** | Ítem del banco | `materiaId`, `tema`, `competencia`, `enunciado`, `opciones` (JSON), `correcta` (índice), `explicacion`, `dificultad` |
| **EvaluacionPregunta** | Relación N:N evaluación↔pregunta | `evaluacionId`, `preguntaId`, `orden` (único por par) |
| **RespuestaEstudiante** | Intento rendido | `estudianteId`, `evaluacionId`, `notaId` (link a la Nota autocreada), `respuestas` (JSON), `puntaje`, `correctas`, `total` |

### Análisis IA
| Modelo | Descripción | Campos clave |
|---|---|---|
| **AnalisisIA** | Resultado de un análisis IA | `estudianteId`, `materiaId?`, `brechas` (JSON), `recomendaciones` (JSON), `ejercicios` (JSON), `resumen`, `meta` (JSON de trazabilidad, ver §8) |

> La nota aprobatoria es **51/100** (escala 0–100). El peso de las evaluaciones de cada materia suma 100.

---

## 6. Funcionalidades

### 6.1 Pantalla de login con roles
- Selección de rol: **Docente** (contraseña) o **Estudiante** (código + contraseña).
- La sesión es una **cookie `httpOnly` firmada** emitida por `/api/auth`; ya no se guarda nada en `localStorage`. Al recargar, la app consulta `GET /api/auth` para saber si hay sesión vigente (8 h).
- Botón **Cerrar sesión** en ambas vistas (`DELETE /api/auth`; recarga la página para limpiar la caché de datos).
- Mensajes de error genéricos («Credenciales incorrectas») y bloqueo temporal tras 5 intentos fallidos.

### 6.2 Vista del Docente (6 pestañas)

| Pestaña | Funcionalidad |
|---|---|
| **Panel general** | KPIs (estudiantes, evaluaciones, promedio general ponderado, % en riesgo) + gráficos: promedio por materia (barras), distribución de riesgo (donut), tasa de aprobación (barras horizontales), **radar de competencias del grupo**, top alertas prioritarias y **competencias a reforzar** (solo las débiles). |
| **Estudiantes** | Tarjetas con promedio y nivel de riesgo por estudiante, buscador y formulario **"Nuevo estudiante"**. |
| **Calificaciones** | Matriz editable estudiantes × evaluaciones por materia. Guardado automático al salir del campo (con spinner por celda), promedio ponderado en columna final, código de color (reprobado <51, en riesgo 51–69, aprobado ≥70). Diálogo de detalle por celda para agregar **observación + evidencia de respuesta** (alimenta el análisis IA). |
| **Evaluaciones** | **Crear evaluaciones desde un banco de preguntas** preestablecido (24 preguntas MCQ, 6 por materia). Selección de materia → banco filtrado → marca preguntas → nombre + peso → crear. Lista de evaluaciones creadas. |
| **Riesgo académico** | Selector de estudiante → perfil completo: tarjeta de riesgo (nivel + puntaje + índice con leyenda), **factores con evidencia**, evolución de notas (barras), **radar de competencias** del estudiante y desglose por materia. |
| **Brechas y refuerzo** | Selector de estudiante + materia → **"Analizar con IA"** → la IA identifica brechas por tema/competencia, genera recomendaciones y ejercicios personalizados. Historial de análisis. |

### 6.3 Vista del Estudiante (3 pestañas)

| Pestaña | Funcionalidad |
|---|---|
| **Mi rendimiento** | El propio perfil: promedio, nivel de riesgo, factores, evolución, **radar de competencias** (con débiles resaltadas) y riesgo por materia. Estado "Sin calificaciones" si no hay notas. |
| **Mis evaluaciones** | Lista de evaluaciones asignadas por el docente → **rendirlas en línea** (opción múltiple) → **autocorrección** al enviar → pantalla de resultado con revisión por pregunta (correcta/incorrecta + explicación). |
| **Mis brechas y refuerzo** | **"Analizar con IA"** sobre las propias respuestas erróneas → brechas, recomendaciones y plan de ejercicios personalizado. Historial. |

### 6.4 Características transversales
- **Tema claro/oscuro** con next-themes.
- **Responsive** (mobile-first; navegación por pestañas con scroll horizontal en móvil).
- **Footer sticky** al fondo (no flota ni se superpone).
- **Toasts** de feedback para acciones (guardar, crear, analizar, errores).
- **Estados de carga y vacío** consistentes.

---

## 7. Predicción de riesgo académico (reglas transparentes)

El riesgo **no** usa modelos de machine learning opacos. Se calcula en `src/lib/risk.ts` con reglas auditable y explicables.

### Umbrales
- Nota aprobatoria: **51/100**.
- Promedio riesgo **alto**: < 60.
- Promedio riesgo **medio**: 60–69.
- Promedio riesgo **bajo**: ≥ 70.

### Factores evaluados (cada uno con evidencia concreta)
| Factor | Tipo | Se dispara cuando |
|---|---|---|
| Promedio bajo | `promedio` | Promedio ponderado < 51 (reprobatorio) o < 70 (en riesgo) |
| Evaluaciones reprobadas | `reprobadas` | 1 reprobada (con detalle) o ≥2 (alerta mayor) |
| Tendencia descendente | `tendencia` | Caída ≥ 10 puntos entre las dos últimas evaluaciones |
| Alto peso reprobado | `peso_alto` | Evaluación con peso ≥ 30% reprobada |
| Variabilidad | `variabilidad` | Desviación estándar > 20 entre evaluaciones |

### Niveles de riesgo
- **Alto** (rojo): promedio < 60, o ≥ 2 reprobadas, o evaluación de alto peso reprobada.
- **Medio** (ámbar): promedio 60–69, o 1 reprobada, o tendencia/variabilidad detectada.
- **Bajo** (verde): promedio ≥ 70, sin reprobadas, sin tendencia negativa.
- **Sin calificaciones** (gris): el estudiante no tiene notas (estado distinto de "riesgo bajo").

### Puntaje de riesgo (0–100) y su relación con el nivel
El puntaje es la **única fuente del nivel**: `0–30 bajo · 31–60 medio · 61–100 alto` (`nivelDesdePuntaje` en `risk.ts`).

1. Suma ponderada de factores: promedio < 51 → 45, < 60 → 30, < 70 → 18; reprobadas ×12; alto peso reprobado +15; tendencia +12; variabilidad +8 (tope 100).
2. Pisos mínimos (reglas duras): si promedio < 60, ≥ 2 reprobadas o alto peso reprobado, el puntaje sube a al menos 61; si promedio < 70, 1 reprobada, tendencia o variabilidad, a al menos 31.
3. El nivel se deriva del puntaje final, por lo que ambos mecanismos no pueden contradecirse.

Verificación: `npx tsx scripts/validar-riesgo.ts` (genera `docs/validacion-riesgo.md`; 2401 casos, 0 incoherencias).

---

## 8. Detección de brechas de aprendizaje con IA

Implementado en `src/lib/ai.ts` con **OpenRouter / google/gemini-2.5-flash** (solo en el backend, en `/api/ai-analysis`).

### Qué hace
1. Recopila las calificaciones del estudiante (y, si se especifica, de una materia) junto con las **evidencias de respuesta** (`respuestaEjemplo`) registradas en las notas — incluidas las autogeneradas al rendir evaluaciones del banco.
2. Construye un **prompt estructurado** que pide al modelo responder **solo con JSON válido**.
3. El modelo identifica:
   - **Brechas** por tema y competencia (con severidad alta/media/baja, descripción y evidencia).
   - **Recomendaciones** de refuerzo (tipo: repaso/ejercicio/recurso/estrategia, con prioridad).
   - **Ejercicios** personalizados (con enunciado, pista, dificultad y tema).
   - Un **resumen** breve.
4. El resultado se **almacena** en `AnalisisIA` y se muestra en el panel con su historial.

### Configuración del modelo y del prompt
| Parámetro | Valor |
|---|---|
| Proveedor | OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) |
| Modelo | `google/gemini-2.5-flash` (variable `OPENROUTER_MODEL`) |
| Temperatura | 0,3 |
| Máximo de tokens de salida | 1200 |
| Razonamiento | Desactivado (ahorra costo; la tarea no lo necesita) |
| Formato de salida | `response_format: json_object` |
| Versión del prompt | `v1.3` (`VERSION_PROMPT` en `ai.ts`) |
| Mensaje de sistema | «Eres tutor universitario. Detectas brechas de aprendizaje a partir de notas y evidencias, y propones refuerzo. Respondes solo JSON minificado, en español, conciso.» |

**Datos enviados al modelo** (`construirPrompt`): materia (o «varias»); solo las evaluaciones con nota < 70, cada una con tema, competencia, nota y evidencia textual recortada a 500 caracteres; y la lista de temas aprobados (≥ 70). **No se envía el nombre del estudiante ni su código.**

**Reglas del prompt:** máx. 4 brechas (alta primero), 3 recomendaciones y 3 ejercicios; cada texto ≤ 25 palabras y resumen ≤ 2 oraciones; citar el tema exacto y el error concreto de la evidencia; si un tema no tiene evidencia textual, declararlo como «Sin evidencia textual (solo nota)» sin inventar errores. Si no hay notas < 70, no se llama al modelo.

**Ahorro:** caché en memoria por hash (modelo + prompt): un mismo análisis no se paga dos veces.

### Qué NO hace la IA
- No calcula notas ni promedios.
- No decide el nivel de riesgo.
- No reemplaza el juicio del docente.
- Solo analiza evidencias y propone refuerzo accionable.

### Validación de la respuesta (prompt v1.3): tolerante, no restrictiva
El modelo es pequeño, por lo que la validación **repara y registra** en lugar de rechazar:
1. **Reparación:** se extrae el JSON aunque venga con texto alrededor, se recortan textos largos y se normalizan las enumeraciones (severidad, prioridad, tipo, dificultad) con valores por defecto.
2. **Ítems incompletos:** se omiten solo los ítems sin campos esenciales; el resto se conserva.
3. **Anclaje (solo auditoría):** las brechas y ejercicios cuyo tema no coincide con las notas bajas enviadas **no se descartan**; se cuentan en `meta.validacion`.
4. **Error solo si no hay nada utilizable:** JSON ilegible o ninguna brecha. La UI ofrece **Reintentar**.
5. **Evidencia:** si un tema no tiene respuesta textual, el modelo declara «Sin evidencia textual (solo nota)» en lugar de inventar errores.
6. **Trazabilidad:** cada análisis guarda en `AnalisisIA.meta` el modelo, versión del prompt, parámetros, tokens y el prompt exacto enviado (sin nombre del estudiante).

Datos enviados al modelo: solo notas < 70 con tema, competencia, nota y evidencia (máx. 500 caracteres), más la lista de temas aprobados. Reproducible con `npx tsx scripts/validar-ia.ts` (`docs/validacion-ia.md`, `docs/ia-resultados.json`).

**Limitación conocida:** el prompt limita a 4 brechas, de modo que con muchas notas bajas (p. ej. 12 o 15) solo se cubre una parte de los temas.

---

## 9. Flujo end-to-end del docente y el estudiante

La narrativa completa de la demostración:

```
1. DOCENTE crea una evaluación desde el banco de preguntas
   (Evaluaciones → selecciona materia → marca preguntas → nombre + peso → Crear)
        │
        ▼
2. ESTUDIANTE la rinde en línea
   (Login como estudiante → Mis evaluaciones → Rendir → responde MCQ → Enviar)
        │
        ▼
3. SISTEMA autocorrige automáticamente
   - Calcula puntaje (0-100) = correctas/total × 100
   - Crea/actualiza la Nota (con observación)
   - Genera la EVIDENCIA textual de los errores (tema, competencia,
     respuesta dada vs. correcta, explicación) y la guarda en Nota.respuestaEjemplo
        │
        ▼
4. La nota aparece en Calificaciones y alimenta el RIESGO ACADÉMICO
   (reglas transparentes: promedio, reprobadas, tendencia, peso, variabilidad)
        │
        ▼
5. La IA analiza las respuestas erróneas (evidencia) y genera el PLAN DE REFUERZO
   (Brechas y refuerzo → Analizar con IA → brechas + recomendaciones + ejercicios)
```

**Cierre del ciclo:** el sistema no solo registra notas, sino que ayuda a comprender *por qué* el estudiante se equivoca y propone *qué hacer* para mejorar.

---

## 10. Estructura de archivos

```
edutrack-ia/
├── prisma/
│   ├── schema.prisma          # 8 modelos (+ passwordHash y meta)
│   ├── seed.ts                # 8 estudiantes, 4 materias, 16 evaluaciones, 128 notas
│   └── seed-preguntas.ts      # 24 preguntas del banco (6 por materia)
├── scripts/                   # verificación reproducible (ver §16)
│   ├── validar-riesgo.ts          # coherencia nivel/puntaje + perfiles
│   ├── validar-autocorreccion.ts  # corrección de exámenes
│   ├── validar-ia.ts              # análisis IA sobre los 8 perfiles (consume crédito)
│   └── set-passwords.ts           # asigna contraseña de demo a estudiantes
├── docs/                      # evidencias generadas por los scripts
│   ├── validacion-riesgo.md
│   ├── validacion-autocorreccion.md
│   ├── validacion-ia.md
│   ├── ia-resultados.json         # prompt exacto, entrada y salida por perfil
│   └── validacion-seguridad.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/route.ts          # Login, sesión actual, logout
│   │   │   ├── data/route.ts          # Dashboard agregado (docente)
│   │   │   ├── students/route.ts      # Crear estudiante (docente)
│   │   │   ├── grades/route.ts        # Upsert nota (docente)
│   │   │   ├── risk/route.ts          # Riesgo general / detalle
│   │   │   ├── ai-analysis/route.ts   # Análisis IA (GET+POST)
│   │   │   ├── banco/route.ts         # Banco de preguntas (docente)
│   │   │   ├── evaluaciones/route.ts  # Crear/listar evaluaciones
│   │   │   └── responder/route.ts     # Autocorregir examen (estudiante)
│   │   └── layout.tsx · page.tsx · globals.css
│   ├── components/
│   │   ├── academico/         # app-shell, login-screen, docente-app, estudiante-app,
│   │   │                      # panel-general, estudiantes-panel, calificaciones-panel,
│   │   │                      # evaluaciones-panel, examen-estudiante, riesgo-panel,
│   │   │                      # perfil-rendimiento, brechas-panel, shared, theme-toggle
│   │   └── ui/                # shadcn/ui
│   ├── hooks/use-academic.ts  # Hooks TanStack Query
│   └── lib/
│       ├── auth.ts            # Cookie firmada, scrypt, guardas de autorización
│       ├── session.ts         # Estado de sesión en la UI (sin persistencia)
│       ├── risk.ts            # Cálculo de riesgo (puntaje → nivel)
│       ├── ai.ts              # Prompt, llamada a OpenRouter, validación tolerante
│       ├── exam.ts            # Autocorrección + evidencia
│       ├── queries.ts         # Consultas y agregaciones
│       └── db.ts · types.ts · utils.ts
└── package.json
```

---

## 11. API REST

Todas son Route Handlers de Next.js con rutas relativas. **Cada ruta valida la cookie de sesión y el rol en el servidor.** «Propio» = un estudiante solo accede a su `estudianteId`.

| Método | Ruta | Descripción | Docente | Estudiante |
|---|---|---|---|---|
| GET | `/api/auth` | Sesión actual (o `null`) | ✔ | ✔ |
| POST | `/api/auth` | Login `{rol, codigo?, password}`; emite la cookie | público | público |
| DELETE | `/api/auth` | Cierra sesión | ✔ | ✔ |
| GET | `/api/data` | Dashboard agregado: materias, estudiantes, notas, riesgo, KPIs | ✔ | ✘ |
| POST | `/api/students` | Crear estudiante (contraseña inicial ≥ 6 caracteres) | ✔ | ✘ |
| POST | `/api/grades` | Upsert de nota por (estudianteId, evaluacionId) | ✔ | ✘ |
| GET | `/api/risk` | Riesgo general de todos los estudiantes | ✔ | ✘ |
| GET | `/api/risk?estudianteId=X` | Detalle de riesgo (general + por materia) | ✔ | propio |
| GET | `/api/ai-analysis?estudianteId=X` | Análisis IA almacenados (con `meta`) | ✔ | propio |
| POST | `/api/ai-analysis` | Ejecuta y guarda un análisis IA | ✔ | propio |
| GET | `/api/banco?materiaId=X` | Banco de preguntas **con respuesta correcta** | ✔ | ✘ |
| GET | `/api/evaluaciones` | Evaluaciones del banco (el estudiante no recibe `correcta` ni ids ajenos) | ✔ | ✔ |
| POST | `/api/evaluaciones` | Crear evaluación desde el banco | ✔ | ✘ |
| POST | `/api/responder` | Autocorrige y crea/actualiza Nota y RespuestaEstudiante; el `estudianteId` sale de la sesión | ✘ | ✔ |

Códigos: `401` sin sesión, `403` rol o identidad no permitidos, `429` demasiados intentos de login.

---

## 12. Cómo ejecutar el proyecto

### Variables de entorno (`.env`; plantilla en `.env.example`)
| Variable | Uso |
|---|---|
| `DATABASE_URL` | Ruta de SQLite (`file:../db/custom.db`) |
| `OPENROUTER_API_KEY` | Clave de OpenRouter (sin ella solo falla «Analizar con IA») |
| `OPENROUTER_MODEL` | Modelo (por defecto `google/gemini-2.5-flash`) |
| `SESSION_SECRET` | **Obligatoria**, ≥ 32 caracteres; firma las cookies de sesión |
| `DOCENTE_PASSWORD` | **Obligatoria**; contraseña del docente |
| `DEMO_ESTUDIANTE_PASSWORD` | Solo para `scripts/set-passwords.ts` |

Generar un secreto: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Pasos
```bash
# 1. Dependencias
bun install

# 2. Crear/actualizar la base de datos (incluye passwordHash y meta)
npx prisma db push

# 3. Datos ficticios (solo si se parte de cero)
bun run prisma/seed.ts
bun run prisma/seed-preguntas.ts

# 4. Contraseña de demo para los estudiantes (usa DEMO_ESTUDIANTE_PASSWORD)
npx tsx scripts/set-passwords.ts            # solo a quienes no tienen
npx tsx scripts/set-passwords.ts --todos    # a todos

# 5. Servidor de desarrollo (puerto 3000)
bun run dev

# 6. Calidad de código
bun run lint
```

- Se sirve en **http://localhost:3000** (ruta única `/`).
- **Acceso:** docente con `DOCENTE_PASSWORD`; estudiante con su código (`EST-001` … `EST-008`) y la contraseña de demo.
- Para restablecer los datos ficticios, repetir los pasos 2–4. Respaldar antes `db/custom.db`.

---

## 13. Alcance y limitaciones

- **Prototipo demostrativo** con datos ficticios. No realiza cálculos oficiales de calificaciones.
- La **IA es de apoyo**: analiza evidencias y propone refuerzo; no decide notas ni riesgo.
- Las reglas de riesgo son **deliberadamente sencillas y transparentes** (no modelos predictivos).
- La persistencia es local (SQLite); no hay integración institucional (SSO). Ver §15 (seguridad) y §17 (resto).

---

## 14. Decisiones de diseño y UX

| Decisión | Razón |
|---|---|
| Paleta **emerald/teal** (sin azul/índigo) | Identidad académica, fresca, distinguible de las plantillas genéricas. |
| **Idioma español** en toda la UI | Audiencia del prototipo. |
| **Login con roles separados** | Coherencia con un sistema universitario real: el estudiante no ve la gestión de calificaciones ni el banco de preguntas; el docente no rinde evaluaciones. |
| **Componentes reutilizables** (`PerfilRendimiento`, `ExamenEstudiante`, `ResultadosAnalisis`) | Evitar duplicación entre la vista docente y la del estudiante. |
| **Footer sticky** | En páginas cortas queda al fondo del viewport; en páginas largas se empuja naturalmente. |
| **Estados de carga, error y vacío** explícitos | Evitar que el sistema parezca roto en casos límite (estudiante sin notas, fallo de IA). |
| **Reglas de riesgo transparentes** | En una feria, el docente debe poder explicar *por qué* un estudiante está en riesgo — los factores y la evidencia están a la vista. |
| **Evidencia de respuesta como puente** | Las respuestas erróneas de las evaluaciones autocorregidas se guardan como evidencia y alimentan a la IA, cerrando el ciclo sin que el docente tenga que pegar evidencias manualmente. |

---

## 15. Seguridad y control de acceso

Implementado en `src/lib/auth.ts` y `src/app/api/auth/route.ts`. Evidencia en `docs/validacion-seguridad.md`.

| Elemento | Implementación |
|---|---|
| Sesión | Cookie `edutrack_session`: `httpOnly`, `SameSite=Strict`, `Secure` en producción, 8 h. Valor = payload (rol, estudianteId, nombre, expiración) + firma HMAC-SHA256 con `SESSION_SECRET`, verificada en tiempo constante |
| Autorización | Cada ruta llama a `autorizar(request, roles)` o `autorizarSobreEstudiante(request, id)`. Sin cookie válida → 401; rol o identidad no permitidos → 403 |
| Contraseñas de estudiantes | Hash scrypt con sal por usuario (`passwordHash`). Se calcula un hash aunque el usuario no exista, para no revelar su existencia por tiempo de respuesta |
| Contraseña del docente | Variable `DOCENTE_PASSWORD`, comparación en tiempo constante |
| Identidad al rendir | `/api/responder` ignora cualquier `estudianteId` del cliente y usa el de la sesión |
| CSRF | `SameSite=Strict` + verificación de que el `Origin` coincide con el `Host` en métodos que modifican |
| Fuerza bruta | 5 intentos fallidos por rol+código+IP → bloqueo de 60 s (429) |
| Minimización de datos | `passwordHash` excluido de todas las consultas; el estudiante no recibe la respuesta correcta ni ids de otros estudiantes; el nombre del estudiante no se envía a la IA |

**Por qué la sesión en `localStorage` no era segura:** cualquier usuario podía editar ese valor para «convertirse» en docente, y las rutas API no verificaban nada. Ahora el navegador no guarda ningún estado de confianza: aunque alguien manipule la interfaz, el servidor rechaza la petición.

**Límites (prototipo):** contraseña única de docente; sin recuperación ni cambio de contraseña; sin registro de auditoría de accesos; el bloqueo por intentos vive en memoria del proceso (no escala a varias instancias); sin HTTPS en el entorno local; las comprobaciones son manuales con `curl`, no una suite automatizada.

---

## 16. Verificación y evidencias reproducibles

Cada script escribe su informe en `docs/`. Los resultados son los de la última ejecución (2026-11-07) sobre la base sembrada (16 evaluaciones, 128 notas).

| Script | Qué verifica | Criterio de aceptación | Resultado |
|---|---|---|---|
| `npx tsx scripts/validar-riesgo.ts` | Coherencia nivel/puntaje en 2401 combinaciones de notas; coincidencia con un oráculo independiente de las reglas duras; 8 casos de borde; recálculo manual del promedio ponderado de los 8 perfiles | 0 incoherencias; Δ promedio ≤ 0,05 | 0 incoherencias, 0 discrepancias, Δ máx. 0,05 |
| `npx tsx scripts/validar-autocorreccion.ts` | Corrige una evaluación temporal de 4 preguntas en 6 escenarios (todas correctas, todas incorrectas, 2/4, 1/4, sin responder, 3 + 1 sin responder) | Puntaje = correctas/total × 100 exacto; evidencia con exactamente las preguntas falladas | 6/6 cumplen |
| `npx tsx scripts/validar-ia.ts` | Ejecuta el análisis IA con los 8 perfiles; mide cobertura de temas bajos, respaldo de la evidencia, brechas basadas solo en la nota, temas no anclados y similitud entre planes | Similitud entre planes < 0,5 | 6 análisis y 2 perfiles sin notas bajas; 0 temas no anclados; similitud media 0,06, máx. 0,15 |
| Pruebas con `curl` | Control de acceso por rol e identidad (`docs/validacion-seguridad.md`) | Códigos HTTP esperados | 25/25 |

**Notas de interpretación**
- `validar-ia.ts` consume crédito de OpenRouter (≈ 0,01 USD por corrida) y guarda en `docs/ia-resultados.json` el prompt exacto, la entrada y la salida, para auditar cualquier afirmación.
- La similitud (Jaccard sobre vocabulario) mide diferenciación entre planes, **no** calidad pedagógica.
- La **pertinencia pedagógica** no se automatiza: `docs/validacion-ia.md` §4 incluye una rúbrica (1–3) que debe completar un docente.
- La base debe estar en estado de seed para reproducir los números; notas de prueba o exámenes rendidos los alteran. Respaldo previo a la limpieza: `db/custom.db.bak-2026-11-07`.

---

## 17. Limitaciones conocidas y trabajo pendiente

| Tema | Detalle | Efecto |
|---|---|---|
| Tendencia en el riesgo general | `calcularRiesgo` toma las dos últimas notas por fecha de **todas** las materias mezcladas, y compara notas de materias distintas | El factor «tendencia» puede activarse o no sin significado académico. Pendiente: calcularla por materia |
| Cobertura de la IA | El prompt limita a 4 brechas y la IA solo ve notas < 70 | Con 12 o 15 notas bajas solo se cubre una parte (Carlos 4/12, Pedro 4/15) |
| Evidencia textual escasa | Pocas notas bajas del seed tienen respuesta textual (Carlos 3/12, Pedro 1/15) | Varias brechas se basan solo en la nota; el sistema lo declara y lo cuenta |
| Validación de la IA | Tolerante a propósito (repara y registra, §8): un tema no anclado se conserva | Un tema impreciso del modelo puede llegar a pantalla; queda registrado en `meta.validacion` |
| Pertinencia pedagógica | Sin evaluación docente | No debe afirmarse efectividad pedagógica; solo funcionamiento y trazabilidad |
| Análisis antiguos | Los guardados antes de esta versión no tienen `meta` | Regenerarlos antes de usarlos como evidencia |
| Muestra | 8 perfiles ficticios, 4 materias | Valida el funcionamiento del prototipo, no su desempeño en poblaciones reales |
| Seguridad | Ver §15 (límites) | Prototipo, no producción |

---

*EduTrack IA — Prototipo para feria universitaria. Datos ficticios. IA de apoyo al aprendizaje.*
