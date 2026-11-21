'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  // Solución basada en CSS: mostramos ambos iconos y alternamos con la clase
  // `dark` que next-themes aplica al <html>. Evita estados de hidratación.
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="size-9 rounded-lg"
    >
      <Sun className="hidden size-4.5 dark:block" />
      <Moon className="block size-4.5 dark:hidden" />
    </Button>
  )
}
