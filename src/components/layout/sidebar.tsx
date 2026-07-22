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
  ClipboardCheck,
  BookOpen,
  FileText,
  Truck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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
      href: '/dashboard/procedures',
      label: 'Pautas Técnicas',
      icon: BookOpen,
      active: pathname?.startsWith('/dashboard/procedures'),
    },
    {
      href: '/dashboard/inventory',
      label: 'Inventario',
      icon: Boxes,
      active: pathname?.startsWith('/dashboard/inventory'),
    },
    {
      href: '/dashboard/suppliers',
      label: 'Proveedores',
      icon: Truck,
      active: pathname?.startsWith('/dashboard/suppliers') || pathname?.startsWith('/dashboard/proveedores'),
    },
    {
      href: '/dashboard/schedule',
      label: 'Programación',
      icon: Calendar,
      active: pathname?.startsWith('/dashboard/schedule'),
    },
    {
      href: '/dashboard/checklists',
      label: 'Inspecciones',
      icon: ClipboardCheck,
      active: pathname?.startsWith('/dashboard/checklists'),
    },
    {
      href: '/dashboard/reports',
      label: 'Reportes',
      icon: FileText,
      active: pathname?.startsWith('/dashboard/reports'),
    },
  ]

  return (
    <div
      className={cn(
        'relative border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">CP</span>
            </div>
            <span className="text-lg font-bold">CMMS Pro</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
            <span className="text-lg font-bold">CP</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 p-4">
        {routes.map((route) => {
          const Icon = route.icon
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                route.active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? route.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{route.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
