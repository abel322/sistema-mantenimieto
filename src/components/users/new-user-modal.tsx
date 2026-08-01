'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { X, UserPlus, Loader2, User, Mail, Lock, Shield } from 'lucide-react'
import { createUser } from '@/app/actions/users'
import { UserRole } from '@prisma/client'

interface NewUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function NewUserModal({ isOpen, onClose, onSuccess }: NewUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(UserRole.TECHNICIAN)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password) {
      setError('Todos los campos con asterisco son obligatorios')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await createUser({
        name,
        email,
        password,
        role,
      })

      if (res.success) {
        onSuccess(res.message || 'Usuario creado exitosamente')
        setName('')
        setEmail('')
        setPassword('')
        setRole(UserRole.TECHNICIAN)
        onClose()
      } else {
        setError(res.error || 'Error al crear el usuario')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al crear el usuario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Crear Nuevo Usuario / Técnico
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} type="button" className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-1 space-y-4 pt-3">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="new-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nombre Completo *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-name"
                className="pl-9 h-10 text-sm"
                placeholder="Ej: Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Correo Electrónico *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-email"
                type="email"
                className="pl-9 h-10 text-sm"
                placeholder="tecnico@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Contraseña Inicial * (Mín. 6 caracteres)
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                className="pl-9 h-10 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rol de Usuario *
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
              <Select
                id="new-role"
                className="pl-9 h-10 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value={UserRole.TECHNICIAN}>🔧 Técnico de Planta</option>
                <option value={UserRole.OPERATOR}>⚙️ Operador de Planta</option>
                <option value={UserRole.SUPERVISOR}>📋 Supervisor</option>
                <option value={UserRole.ADMIN}>🛡️ Administrador del Sistema</option>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" /> Crear Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
