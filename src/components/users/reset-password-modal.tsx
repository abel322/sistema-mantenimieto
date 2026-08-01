'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { X, Key, Loader2, Lock } from 'lucide-react'
import { resetUserPassword } from '@/app/actions/users'

interface ResetPasswordModalProps {
  isOpen: boolean
  user: { id: string; name: string; email: string } | null
  onClose: () => void
  onSuccess: (message: string) => void
}

export function ResetPasswordModal({ isOpen, user, onClose, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setError('Ambos campos de contraseña son obligatorios')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await resetUserPassword({
        userId: user.id,
        newPassword,
      })

      if (res.success) {
        onSuccess(res.message || 'Contraseña restablecida con éxito')
        setNewPassword('')
        setConfirmPassword('')
        onClose()
      } else {
        setError(res.error || 'Error al restablecer la contraseña')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            Restablecer Contraseña
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} type="button" className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-1 space-y-4 pt-3">
          <p className="text-xs text-muted-foreground">
            Estás restableciendo la contraseña del usuario <strong>{user.name}</strong> ({user.email}).
          </p>

          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="reset-new-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nueva Contraseña * (Mín. 6 caracteres)
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-new-password"
                type="password"
                className="pl-9 h-10 text-sm"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reset-confirm-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Confirmar Nueva Contraseña *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-confirm-password"
                type="password"
                className="pl-9 h-10 text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Actualizando...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" /> Restablecer Contraseña
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
