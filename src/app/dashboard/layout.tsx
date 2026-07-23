'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { UserNav } from '@/components/layout/user-nav'
import { NotificationsBell } from '@/components/layout/notifications-bell'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Bar */}
        <header className="border-b bg-background w-full max-w-full overflow-x-hidden">
          <div className="flex h-16 items-center px-4 md:px-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Logo */}
            <div className="flex items-center space-x-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">CP</span>
              </div>
              <span className="text-sm font-bold">CMMS Pro</span>
            </div>

            {/* Notifications Bell & User Nav */}
            <div className="ml-auto flex items-center space-x-3">
              <NotificationsBell />
              <UserNav />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-2 sm:p-4 md:p-6 min-w-0 w-full max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
