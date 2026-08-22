import { Users, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { currentUser } = useAuth()
  const firstName = currentUser?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Hey, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your expense summary will appear here once you join a group.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Users className="size-7 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="mb-1 text-base font-semibold text-foreground">No groups yet</h2>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Create a group with friends, flatmates, or travel companions to start tracking shared expenses.
        </p>
        <Button asChild>
          <Link to="/groups">
            <PlusCircle className="mr-2 size-4" />
            Create your first group
          </Link>
        </Button>
      </div>
    </div>
  )
}
