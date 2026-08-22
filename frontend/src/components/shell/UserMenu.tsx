import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import type { User as UserType } from '@/types/api'

function getInitials(user: UserType): string {
  if (user.name) {
    return user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}

// eslint-disable-next-line react-refresh/only-export-components -- utility co-located with component
export { getInitials }

export default function UserMenu() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  if (!currentUser) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar>
          <AvatarFallback>{getInitials(currentUser)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium leading-none">
            {currentUser.name ?? currentUser.email}
          </p>
          {currentUser.name && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {currentUser.email}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
