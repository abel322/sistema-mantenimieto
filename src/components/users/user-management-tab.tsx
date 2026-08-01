'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Toast, ToastMessage } from '@/components/ui/toast'
import { NewUserModal } from './new-user-modal'
import { ResetPasswordModal } from './reset-password-modal'
import { getUsers, toggleUserStatus, deleteUser } from '@/app/actions/users'
import { UserRole } from '@prisma/client'
import {
  Users,
  UserPlus,
  Search,
  Key,
  Shield,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react'

interface UserItem {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: Date | string
}

export function UserManagementTab() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchUserList = async () => {
    setLoading(true)
    try {
      const res = await getUsers()
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users as UserItem[])
      } else if (res.error) {
        setToast({
          id: Date.now().toString(),
          title: 'Error de Acceso',
          description: res.error,
          type: 'error',
        })
      }
    } catch (err: any) {
      console.error('Error fetching user list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserList()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const query = search.toLowerCase().trim()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    )
  }, [users, search])

  const handleToggleStatus = async (user: UserItem) => {
    setActionLoadingId(user.id)
    try {
      const res = await toggleUserStatus(user.id, !user.isActive)
      if (res.success) {
        setToast({
          id: Date.now().toString(),
          title: 'Estado de Usuario Actualizado',
          description: res.message || `Usuario ${!user.isActive ? 'activado' : 'desactivado'}.`,
          type: 'success',
        })
        fetchUserList()
      } else {
        setToast({
          id: Date.now().toString(),
          title: 'Error',
          description: res.error || 'No se pudo cambiar el estado del usuario',
          type: 'error',
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return
    setActionLoadingId(deletingUser.id)
    try {
      const res = await deleteUser(deletingUser.id)
      if (res.success) {
        setToast({
          id: Date.now().toString(),
          title: 'Usuario Eliminado',
          description: res.message || 'El usuario ha sido eliminado.',
          type: 'success',
        })
        setDeletingUser(null)
        fetchUserList()
      } else {
        setToast({
          id: Date.now().toString(),
          title: 'Error al Eliminar',
          description: res.error || 'No se pudo eliminar el usuario',
          type: 'error',
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">🛡️ Administrador</Badge>
      case 'SUPERVISOR':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">📋 Supervisor</Badge>
      case 'OPERATOR':
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white">⚙️ Operador</Badge>
      case 'TECHNICIAN':
      default:
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">🔧 Técnico</Badge>
    }
  }

  return (
    <div className="space-y-6 w-full">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-card border rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Gestión de Usuarios y Personal</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crea y administra las cuentas de técnicos, operadores y supervisores de planta.
          </p>
        </div>

        <Button
          onClick={() => setIsNewUserModalOpen(true)}
          className="w-full sm:w-auto font-semibold gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> + Crear Nuevo Usuario / Técnico
        </Button>
      </div>

      {/* Search and Stats Bar */}
      <Card className="shadow-sm border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, correo o rol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserList}
              disabled={loading}
              className="gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refrescar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table / List */}
      <Card className="shadow-sm border overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Cargando directorio de usuarios...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium">No se encontraron usuarios registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="p-3 sm:p-4">Usuario</th>
                    <th className="p-3 sm:p-4">Correo Electrónico</th>
                    <th className="p-3 sm:p-4">Rol de Acceso</th>
                    <th className="p-3 sm:p-4">Estado</th>
                    <th className="p-3 sm:p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => {
                    const isLoadingAction = actionLoadingId === user.id

                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 sm:p-4 font-semibold text-foreground">
                          {user.name}
                        </td>
                        <td className="p-3 sm:p-4 text-muted-foreground font-mono text-xs">
                          {user.email}
                        </td>
                        <td className="p-3 sm:p-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="p-3 sm:p-4">
                          {user.isActive ? (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30 gap-1">
                              <XCircle className="w-3 h-3" /> Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResettingUser(user)}
                              disabled={isLoadingAction}
                              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              title="Restablecer Contraseña"
                            >
                              <Key className="w-4 h-4" />
                            </Button>

                            {/* Toggle Active Status Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              disabled={isLoadingAction}
                              className={`h-8 px-2 ${
                                user.isActive
                                  ? 'text-slate-500 hover:text-destructive hover:bg-destructive/10'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={user.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                            >
                              {isLoadingAction ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>

                            {/* Delete User Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingUser(user)}
                              disabled={isLoadingAction}
                              className="h-8 px-2 text-destructive hover:bg-destructive/10"
                              title="Eliminar Usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onSuccess={(msg) => {
          setToast({
            id: Date.now().toString(),
            title: 'Éxito',
            description: msg,
            type: 'success',
          })
          fetchUserList()
        }}
      />

      <ResetPasswordModal
        isOpen={!!resettingUser}
        user={resettingUser}
        onClose={() => setResettingUser(null)}
        onSuccess={(msg) => {
          setToast({
            id: Date.now().toString(),
            title: 'Éxito',
            description: msg,
            type: 'success',
          })
          fetchUserList()
        }}
      />

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Cuenta de Usuario?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar al usuario <strong>"{deletingUser.name}" ({deletingUser.email})</strong>? Esta acción revocará todos sus accesos al sistema.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingUser(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUserConfirm} disabled={actionLoadingId === deletingUser.id}>
                {actionLoadingId === deletingUser.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Eliminando...
                  </>
                ) : (
                  'Confirmar Eliminación'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
