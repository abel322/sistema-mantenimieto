'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, ChevronDown, UserCheck } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export function UserNav() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const userName = session?.user?.name || 'Administrador'
  const userEmail = session?.user?.email || 'admin@cmms.com'
  const userRole = session?.user?.role || 'ADMIN'

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <ThemeToggle />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer select-none"
            aria-label="Menú de usuario"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0 shadow-sm">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-none text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{userRole}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 p-2 space-y-1 shadow-lg border">
          {/* User Info Header */}
          <div className="px-3 py-2.5 bg-muted/50 rounded-md border space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground leading-tight truncate">{userName}</p>
              <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                {userRole}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Menu Option 1: Mi Perfil */}
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Mi Perfil</span>
          </Link>

          {/* Menu Option 2: Cerrar Sesión */}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              signOut({ callbackUrl: '/login' })
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
