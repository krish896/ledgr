import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppHeader from '@/components/shell/AppHeader'
import BottomNav from '@/components/shell/BottomNav'

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-full rounded-md bg-muted" />
      <div className="h-4 w-3/4 rounded-md bg-muted" />
    </div>
  )
}

export default function AppLayout() {
  const { authenticated, loading } = useAuth()

  if (!loading && !authenticated) return <Navigate to="/auth/login" replace />

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 pb-[calc(var(--bottom-nav-height)+1.5rem)] sm:px-6 md:pb-6 lg:px-8">
        {loading ? <PageSkeleton /> : <Outlet />}
      </main>
      <BottomNav />
    </div>
  )
}
