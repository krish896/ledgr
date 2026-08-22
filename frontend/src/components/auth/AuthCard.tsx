import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export default function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className="space-y-1 text-center">
        <Link
          to="/dashboard"
          className="mb-4 inline-block text-2xl font-bold tracking-tight text-primary"
        >
          Ledgr
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  )
}
