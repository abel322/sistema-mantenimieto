'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut, User, Settings } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export function UserNav() {
  const { data: session } = useSession()

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
        title="Ver Mi Perfil"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
          <User className="h-4 w-4" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium leading-none">{session?.user?.name || 'Administrador'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.role || 'ADMIN'}</p>
        </div>
      </Link>

      <Link href="/dashboard/profile">
        <Button
          variant="ghost"
          size="icon"
          title="Mi Perfil y Configuración"
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: '/login' })}
        title="Cerrar sesión"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  )
}
