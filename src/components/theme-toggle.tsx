'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Laptop } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="h-4 w-4 text-sky-400" />
    }
    if (theme === 'light') {
      return <Sun className="h-4 w-4 text-amber-500" />
    }
    return <Laptop className="h-4 w-4 text-primary" />
  }

  const getTitle = () => {
    if (theme === 'dark') return 'Modo Oscuro (click para Modo Sistema)'
    if (theme === 'light') return 'Modo Claro (click para Modo Oscuro)'
    return 'Tema del Sistema (click para Modo Claro)'
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9 rounded-full border border-border hover:bg-accent transition-colors"
      title={getTitle()}
    >
      {getIcon()}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
