import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { isOnboardingDone } from '@/utils/onboarding'
import AppLoadingScreen from '@/components/shell/AppLoadingScreen'

export default function RootGuard() {
  const { authenticated, loading } = useAuth()
  const location = useLocation()
  const onboardingDone = isOnboardingDone()

  if (loading) return <AppLoadingScreen />

  if (authenticated) {
    if (
      location.pathname === '/onboarding' ||
      location.pathname.startsWith('/auth/')
    ) {
      return <Navigate to="/dashboard" replace />
    }
    return <Outlet />
  }

  if (!onboardingDone) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />
    }
    return <Outlet />
  }

  if (location.pathname.startsWith('/auth/')) return <Outlet />
  return <Navigate to="/auth/login" replace />
}
