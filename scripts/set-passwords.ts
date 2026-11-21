// Asigna contraseña a los estudiantes que aún no tienen (o a todos con --todos).
// Uso: DEMO_ESTUDIANTE_PASSWORD=... npx tsx scripts/set-passwords.ts [--todos]
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const db = new PrismaClient()
async function main() {
  const pass = process.env.DEMO_ESTUDIANTE_PASSWORD
  if (!pass || pass.length < 6) throw new Error('Define DEMO_ESTUDIANTE_PASSWORD (mínimo 6 caracteres).')
  const todos = process.argv.includes('--todos')
  const r = await db.estudiante.findMany({ where: todos ? {} : { passwordHash: null } })
  for (const e of r) await db.estudiante.update({ where: { id: e.id }, data: { passwordHash: hashPassword(pass) } })
  console.log(`Contraseña asignada a ${r.length} estudiante(s).`)
}
main().finally(() => db.$disconnect())
