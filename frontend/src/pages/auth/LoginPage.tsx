import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthCard from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'
import type { AuthResponse } from '@/types/api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  // Email pre-fill passed from register page (409 flow) or other redirects
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail, password: '' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', values)
      login(data.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e.status === 401) {
        setServerError('Incorrect email or password.')
      } else {
        setServerError(e.message ?? 'Sign in failed. Please try again.')
      }
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Ledgr account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/auth/register" className="text-primary underline-offset-2 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}
