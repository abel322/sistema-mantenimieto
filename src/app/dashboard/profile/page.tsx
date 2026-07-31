import { Suspense } from 'react'
import { ProfileView } from '@/components/profile/profile-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi Perfil | CMMS Pro',
  description: 'Gestión de perfil de usuario y configuración de seguridad de la cuenta.',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando perfil...</div>}>
      <ProfileView />
    </Suspense>
  )
}
