import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart2, Receipt, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'

const navItems = [
  { label: 'Balances', path: 'balances', icon: BarChart2 },
  { label: 'Expenses', path: 'expenses', icon: Receipt },
  { label: 'Activity', path: 'activity', icon: Clock },
  { label: 'Group info', path: 'info', icon: Info },
] as const

interface Props {
  groupId: string
  groupName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GroupDrawer({ groupId, groupName, open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleNav(path: string) {
    navigate(`/groups/${groupId}/${path}`)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="text-left text-base">{groupName}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname.endsWith(`/${path}`)
            return (
              <SheetClose
                key={path}
                render={
                  <button
                    onClick={() => handleNav(path)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </button>
                }
              />
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
