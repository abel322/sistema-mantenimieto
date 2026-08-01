'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface ResetUserPasswordPayload {
  userId: string
  newPassword: string
}

async function verifyAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error('No tienes una sesión activa.')
  }
  if (session.user.role !== 'ADMIN') {
    throw new Error('Acceso denegado: Se requieren permisos de Administrador.')
  }
  return session.user
}

export async function getUsers() {
  try {
    await verifyAdminSession()

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, users }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return { success: false, error: error.message || 'Error al obtener usuarios.' }
  }
}

export async function createUser(payload: CreateUserPayload) {
  try {
    await verifyAdminSession()

    const name = payload.name?.trim() || ''
    const email = payload.email?.trim().toLowerCase() || ''
    const password = payload.password || ''
    const role = payload.role

    if (!name || !email || !password) {
      return {
        success: false,
        error: 'El nombre, correo y contraseña son obligatorios.',
      }
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'La contraseña inicial debe tener al menos 6 caracteres.',
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'El correo electrónico ya se encuentra registrado en el sistema.',
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || UserRole.TECHNICIAN,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard/users')
    return {
      success: true,
      message: 'Usuario creado exitosamente',
      user,
    }
  } catch (error: any) {
    console.error('Error in createUser action:', error)
    return {
      success: false,
      error: error.message || 'Error al crear el usuario.',
    }
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    const adminUser = await verifyAdminSession()

    if (adminUser.id === userId && !isActive) {
      return {
        success: false,
        error: 'No puedes desactivar tu propia cuenta de administrador.',
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard/users')
    return {
      success: true,
      message: `Usuario ${user.name} ${isActive ? 'activado' : 'desactivado'} correctamente.`,
      user,
    }
  } catch (error: any) {
    console.error('Error in toggleUserStatus action:', error)
    return {
      success: false,
      error: error.message || 'Error al cambiar el estado del usuario.',
    }
  }
}

export async function resetUserPassword(payload: ResetUserPasswordPayload) {
  try {
    await verifyAdminSession()

    const { userId, newPassword } = payload

    if (!userId || !newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres.',
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard/users')
    return {
      success: true,
      message: 'Contraseña del usuario restablecida con éxito.',
    }
  } catch (error: any) {
    console.error('Error in resetUserPassword action:', error)
    return {
      success: false,
      error: error.message || 'Error al restablecer la contraseña del usuario.',
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    const adminUser = await verifyAdminSession()

    if (adminUser.id === userId) {
      return {
        success: false,
        error: 'No puedes eliminar tu propia cuenta de administrador.',
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard/users')
    return {
      success: true,
      message: 'Usuario eliminado del sistema correctamente.',
    }
  } catch (error: any) {
    console.error('Error in deleteUser action:', error)
    return {
      success: false,
      error: error.message || 'Error al eliminar el usuario.',
    }
  }
}
