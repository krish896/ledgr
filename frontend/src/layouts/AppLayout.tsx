import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AppLayout() {
  const { authenticated, loading } = useAuth()

  if (loading) return null

  if (!authenticated) return <Navigate to="/auth/login" replace />

  return <Outlet />
}
