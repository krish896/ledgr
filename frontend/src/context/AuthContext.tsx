import { createContext, useCallback, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { User } from '@/types/api'

interface AuthState {
  currentUser: User | null
  loading: boolean
  authenticated: boolean
  refreshUser: () => Promise<void>
  login: (user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchSession(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>('/auth/me')
    return data.user
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: currentUser = null, isPending: loading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: fetchSession,
    retry: false,
    staleTime: Infinity,
  })

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
  }, [queryClient])

  const login = useCallback(
    (user: User) => {
      queryClient.setQueryData(['auth', 'session'], user)
    },
    [queryClient]
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      queryClient.setQueryData(['auth', 'session'], null)
    }
  }, [queryClient])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authenticated: currentUser !== null,
        refreshUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider intentionally
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
