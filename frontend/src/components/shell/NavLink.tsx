import { NavLink as RouterNavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  to: string
  children: React.ReactNode
}

export default function NavLink({ to, children }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex h-full items-center border-b-2 px-3 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )
      }
    >
      {children}
    </RouterNavLink>
  )
}
