'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const routes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      active: pathname === '/dashboard',
    },
    {
      href: '/dashboard/work-orders',
      label: 'Órdenes',
      active: pathname?.startsWith('/dashboard/work-orders'),
    },
    {
      href: '/dashboard/assets',
      label: 'Activos',
      active: pathname?.startsWith('/dashboard/assets'),
    },
    {
      href: '/dashboard/inventory',
      label: 'Inventario',
      active: pathname?.startsWith('/dashboard/inventory'),
    },
    {
      href: '/dashboard/schedule',
      label: 'Programación',
      active: pathname?.startsWith('/dashboard/schedule'),
    },
    {
      href: '/dashboard/reports',
      label: 'Reportes',
      active: pathname?.startsWith('/dashboard/reports'),
    },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={cn('hidden md:flex items-center space-x-4 lg:space-x-6', className)}
        {...props}
      >
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              route.active
                ? 'text-black dark:text-white'
                : 'text-muted-foreground'
            )}
          >
            {route.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden z-50">
          <nav className="flex flex-col p-4 space-y-3">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md',
                  route.active
                    ? 'bg-accent text-black dark:text-white'
                    : 'text-muted-foreground'
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
