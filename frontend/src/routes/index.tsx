import { createBrowserRouter, Navigate } from 'react-router-dom'

import RootGuard from '@/routes/RootGuard'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'

import OnboardingPage from '@/pages/OnboardingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import GroupsPage from '@/pages/groups/GroupsPage'
import GroupDetailPage from '@/pages/groups/GroupDetailPage'
import GroupExpensesPage from '@/pages/groups/GroupExpensesPage'
import GroupBalancesPage from '@/pages/groups/GroupBalancesPage'
import GroupActivityPage from '@/pages/groups/GroupActivityPage'
import GroupInfoPage from '@/pages/groups/GroupInfoPage'
import HistoryPage from '@/pages/HistoryPage'
import ProfilePage from '@/pages/ProfilePage'

const router = createBrowserRouter([
  {
    element: <RootGuard />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/auth/login', element: <LoginPage /> },
          { path: '/auth/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/groups', element: <GroupsPage /> },
          {
            path: '/groups/:groupId',
            element: <GroupDetailPage />,
            children: [
              { index: true, element: <Navigate to="expenses" replace /> },
              { path: 'expenses', element: <GroupExpensesPage /> },
              { path: 'balances', element: <GroupBalancesPage /> },
              { path: 'activity', element: <GroupActivityPage /> },
              { path: 'info', element: <GroupInfoPage /> },
            ],
          },
          { path: '/history', element: <HistoryPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
])

export default router
