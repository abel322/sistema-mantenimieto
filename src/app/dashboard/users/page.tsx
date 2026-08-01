import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { UserManagementTab } from '@/components/users/user-management-tab'

export default async function UsersDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 pt-6 w-full max-w-7xl mx-auto">
      <UserManagementTab />
    </div>
  )
}
