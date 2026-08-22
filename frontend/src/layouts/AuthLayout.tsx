import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AuthLayout() {
  const { authenticated, loading } = useAuth()

  if (loading) return null

  if (authenticated) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
