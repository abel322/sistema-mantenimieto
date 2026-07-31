'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export interface UpdateProfilePayload {
  name: string
  email: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function updateUserProfile(payload: UpdateProfilePayload) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return { success: false, error: 'No tienes una sesión activa' }
    }

    const { name, email } = payload

    if (!name || !name.trim() || !email || !email.trim()) {
      return { success: false, error: 'Nombre y correo electrónico son obligatorios' }
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    // Find current user in DB
    const userId = session.user.id
    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: session.user.email || '' },
        ],
      },
    })

    if (!currentUser) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Check if new email is already used by another user
    if (trimmedEmail !== currentUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          id: { not: currentUser.id },
        },
      })
      if (existingUser) {
        return { success: false, error: 'El correo electrónico ya está registrado por otro usuario' }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: trimmedName,
        email: trimmedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Información personal actualizada correctamente.',
      user: updatedUser,
    }
  } catch (error: any) {
    console.error('Error in updateUserProfile action:', error)
    return { success: false, error: error.message || 'Error al actualizar los datos personales' }
  }
}

export async function updateUserPassword(payload: UpdatePasswordPayload) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return { success: false, error: 'No tienes una sesión activa' }
    }

    const { currentPassword, newPassword, confirmPassword } = payload

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: 'Por favor complete todos los campos de contraseña' }
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'La nueva contraseña y la confirmación no coinciden' }
    }

    // Find current user with password hash
    const userId = session.user.id
    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: session.user.email || '' },
        ],
      },
    })

    if (!currentUser || !currentUser.password) {
      return { success: false, error: 'Usuario no encontrado en la base de datos' }
    }

    // Verify current password against stored hash
    const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
    if (!isPasswordValid) {
      return { success: false, error: 'La contraseña actual es incorrecta' }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: hashedPassword,
      },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Contraseña actualizada correctamente.',
    }
  } catch (error: any) {
    console.error('Error in updateUserPassword action:', error)
    return { success: false, error: error.message || 'Error al actualizar la contraseña' }
  }
}
