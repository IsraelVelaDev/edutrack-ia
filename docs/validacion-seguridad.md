# Validación del control de acceso

Pruebas con `curl` sobre el servidor real (2026-11-07). Cada fila es una petición; «Esperado» y «Obtenido» son códigos HTTP.

## Mecanismo

| Elemento | Implementación |
|---|---|
| Sesión | Cookie `edutrack_session` `httpOnly`, `SameSite=Strict`, `Secure` en producción, 8 h, firmada con HMAC-SHA256 (`SESSION_SECRET`) |
| Contraseñas | Estudiantes: hash scrypt con sal (campo `passwordHash`). Docente: `DOCENTE_PASSWORD` del entorno, comparación en tiempo constante |
| Autorización | Cada ruta `/api/*` valida cookie y rol en el servidor (`src/lib/auth.ts`). El `localStorage` ya no interviene |
| Identidad del estudiante | En `/api/responder` el id sale de la sesión, no del cuerpo de la petición |
| CSRF | `SameSite=Strict` + comprobación de `Origin` en métodos que modifican |
| Fuerza bruta | 5 intentos fallidos por rol+código+IP y bloqueo de 60 s |
| Filtración de datos | `passwordHash` excluido de todas las consultas; el estudiante no ve `correcta` ni los ids de otros estudiantes |

## Resultados

| Prueba | Esperado | Obtenido |
|---|---|---|
| Login docente con contraseña incorrecta | 401 | 401 |
| Login estudiante con contraseña incorrecta | 401 | 401 |
| Sin sesión: `data`, `risk`, `risk?estudianteId`, `ai-analysis`, `banco`, `evaluaciones`, `grades` | 401 (7) | 401 (7) |
| Cookie falsificada con rol docente y firma inventada | 401 | 401 |
| Estudiante: su propio riesgo | 200 | 200 |
| Estudiante: riesgo de otro estudiante | 403 | 403 |
| Estudiante: análisis IA ajeno (GET y POST) | 403 | 403 / 403 |
| Estudiante: `data`, `banco`, `grades`, `students` | 403 (4) | 403 (4) |
| Estudiante: `evaluaciones` | 200, sin respuesta correcta | 200, 0 apariciones de `correcta` |
| Docente: `data`, `banco`, riesgo de cualquier estudiante | 200 | 200 |
| Docente: `responder` | 403 | 403 |
| `passwordHash` presente en `/api/data` | 0 | 0 |
| Petición modificadora con `Origin` ajeno | 403 | 403 |
| 6.º intento fallido seguido | 429 | 429 |

## Límites que debe declarar el artículo

- Es un prototipo: la contraseña del docente es única y viene del entorno; no hay recuperación, cambio de contraseña ni auditoría de accesos.
- El límite de intentos vive en memoria del proceso (se reinicia con el servidor y no escala a varias instancias).
- Falta HTTPS en el despliegue local; la marca `Secure` de la cookie solo se activa en producción.
- No hay pruebas automatizadas continuas: estas comprobaciones son manuales y reproducibles con `curl`.
