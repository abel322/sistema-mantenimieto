'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Boxes, 
  Calendar, 
  FileText,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      href: '/dashboard/work-orders',
      label: 'Órdenes de Trabajo',
      icon: ClipboardList,
      active: pathname?.startsWith('/dashboard/work-orders'),
    },
    {
      href: '/dashboard/assets',
      label: 'Activos',
      icon: Package,
      active: pathname?.startsWith('/dashboard/assets'),
    },
    {
      href: '/dashboard/inventory',
      label: 'Inventario',
      icon: Boxes,
      active: pathname?.startsWith('/dashboard/inventory'),
    },
    {
      href: '/dashboard/schedule',
      label: 'Programación',
      icon: Calendar,
      active: pathname?.startsWith('/dashboard/schedule'),
    },
    {
      href: '/dashboard/reports',
      label: 'Reportes',
      icon: FileText,
      active: pathname?.startsWith('/dashboard/reports'),
    },
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r z-50 md:hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">CP</span>
            </div>
            <span className="text-lg font-bold">CMMS Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 p-4">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  route.active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{route.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
