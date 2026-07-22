'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export function UserNav() {
  const { data: session } = useSession()

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium leading-none">{session?.user?.name || 'Administrador'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.role || 'ADMIN'}</p>
        </div>
      </div>
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
