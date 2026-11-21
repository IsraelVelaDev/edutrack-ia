# 🚀 EduTrack IA — Inicio rápido

Prototipo de sistema universitario de calificaciones con IA (feria de proyectos).

## Requisitos
- **Bun** (recomendado) o Node.js 18+ con npm/yarn/pnpm.
- Un archivo `.env` (copia de `.env.example`) con `SESSION_SECRET` (≥ 32 caracteres) y `DOCENTE_PASSWORD`. Para la IA, `OPENROUTER_API_KEY`: **sin ella solo «Analizar con IA» muestra un error manejado; el resto funciona.**

## Pasos para levantarlo

```bash
# 1. Descomprime el zip
unzip edutrack-ia.zip
cd edutrack-ia

# 2. Instala dependencias (también genera el cliente Prisma)
bun install
# (si no se generó el cliente:) bun run db:generate

# 3. Crea la base y asigna contraseña de demo a los estudiantes
npx prisma db push
npx tsx scripts/set-passwords.ts   # usa DEMO_ESTUDIANTE_PASSWORD del .env

# 4. Arranca el servidor de desarrollo
bun run dev
```

Abre **http://localhost:3000** (la primera carga tarda unos segundos por compilación).

## Credenciales de la demo
- **Docente** → contraseña `DOCENTE_PASSWORD` del `.env`.
- **Estudiante** → código (`EST-001` … `EST-008`) y la contraseña `DEMO_ESTUDIANTE_PASSWORD` del `.env`.

Tras 5 intentos fallidos el acceso se bloquea 1 minuto.

## Datos incluidos
La base SQLite (`db/custom.db`) **ya viene sembrada**:
- 8 estudiantes ficticios
- 4 materias (Programación I, Matemática Discreta, Estructuras de Datos, Bases de Datos)
- 16 evaluaciones + 128 notas
- 24 preguntas en el banco (6 por materia)

### Para regenerar los datos desde cero
```bash
bun run db:push              # crea las tablas (acepta pérdida de datos)
bun run prisma/seed.ts       # estudiantes, materias, evaluaciones, notas
bun run prisma/seed-preguntas.ts   # banco de preguntas
```

## Otros comandos útiles
```bash
bun run lint                 # verificar calidad de código
bun run db:generate           # regenerar el cliente Prisma
```

## Estructura
- `/` → única ruta visible (login → docente/estudiante)
- Panel del **docente**: 6 pestañas (Panel general, Estudiantes, Calificaciones, Evaluaciones, Riesgo académico, Brechas y refuerzo)
- Panel del **estudiante**: 3 pestañas (Mi rendimiento, Mis evaluaciones, Mis brechas y refuerzo)

## Verificación
```bash
npx tsx scripts/validar-riesgo.ts          # riesgo y promedios
npx tsx scripts/validar-autocorreccion.ts  # corrección de exámenes
npx tsx scripts/validar-ia.ts              # IA (consume crédito)
```
Los informes se escriben en `docs/`.

## Documentación
Ver `DOCUMENTACION.md` (objetivo, tecnologías, modelo de datos, riesgo, IA, API, seguridad, verificación y limitaciones).

---
*Prototipo demostrativo con datos ficticios. La IA es de apoyo: no calcula notas oficiales.*
