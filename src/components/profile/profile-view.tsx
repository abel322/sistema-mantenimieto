'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Toast, ToastMessage } from '@/components/ui/toast'
import { updateUserProfile, updateUserPassword } from '@/app/actions/profile'
import {
  User,
  Mail,
  Lock,
  Key,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export function ProfileView() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  // Personal Info form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Toast notification
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim()) {
      setProfileError('Nombre y correo electrónico son obligatorios')
      return
    }

    setSavingProfile(true)
    setProfileError(null)

    try {
      const res = await updateUserProfile({ name, email })

      if (res.success) {
        setToast({
          id: Date.now().toString(),
          title: 'Perfil Actualizado',
          description: res.message || 'Información personal actualizada correctamente.',
          type: 'success',
        })
        // Refresh NextAuth session client state
        await updateSession({ name, email })
        router.refresh()
      } else {
        setProfileError(res.error || 'No se pudo actualizar el perfil')
      }
    } catch (err: any) {
      console.error(err)
      setProfileError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos de contraseña son obligatorios')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La nueva contraseña y la confirmación no coinciden')
      return
    }

    setSavingPassword(true)
    setPasswordError(null)

    try {
      const res = await updateUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (res.success) {
        setToast({
          id: Date.now().toString(),
          title: 'Contraseña Actualizada',
          description: res.message || 'Contraseña actualizada correctamente.',
          type: 'success',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(res.error || 'No se pudo actualizar la contraseña')
      }
    } catch (err: any) {
      console.error(err)
      setPasswordError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Toast Component */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 bg-card border rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {session?.user?.name || 'Mi Perfil'}
              </h2>
              <Badge variant="outline" className="text-xs font-semibold">
                {session?.user?.role || 'USUARIO'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Configura tus datos personales de cuenta y credenciales de acceso.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD A: Información Personal */}
        <Card className="shadow-sm border">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Información Personal</CardTitle>
                <CardDescription className="text-xs">
                  Actualiza tu nombre visible y tu dirección de correo corporativo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {profileError && (
                <div className="flex items-center gap-2 p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="profile-name" className="font-semibold text-xs text-foreground">
                  Nombre Completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Fernando Alvarez"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email" className="font-semibold text-xs text-foreground">
                  Correo Electrónico *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full sm:w-auto font-semibold gap-2 shadow-sm"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Guardar Datos Personales
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* CARD B: Seguridad y Contraseña */}
        <Card className="shadow-sm border">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Seguridad y Contraseña</CardTitle>
                <CardDescription className="text-xs">
                  Modifica tu contraseña de acceso mediante verificación de identidad.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-password" className="font-semibold text-xs text-foreground">
                  Contraseña Actual *
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-semibold text-xs text-foreground">
                  Nueva Contraseña * (Mín. 6 caracteres)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-semibold text-xs text-foreground">
                  Confirmar Nueva Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full sm:w-auto font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Actualizando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Actualizar Contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
