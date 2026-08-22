import { Plus, Users, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useGroups } from '@/hooks/queries'
import CreateGroupDialog from '@/components/groups/CreateGroupDialog'
import CreateExpenseSheet from '@/components/expenses/CreateExpenseSheet'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const firstName = currentUser?.name?.split(' ')[0] ?? 'there'

  const { data: groups = [], isLoading } = useGroups()

  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [addExpenseGroupId, setAddExpenseGroupId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Hey, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {groups.length > 0
            ? "Here's what's happening across your groups."
            : 'Your expense summary will appear here once you join a group.'}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--surface))] px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="size-7 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mb-1 text-base font-semibold text-foreground">No groups yet</h2>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Create a group with friends, flatmates, or travel companions to start tracking shared expenses.
          </p>
          <Button onClick={() => setCreateGroupOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create your first group
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (groups.length === 1) {
                  setAddExpenseGroupId(groups[0].id)
                } else {
                  navigate('/groups')
                }
              }}
            >
              <Plus className="mr-1 size-4" />
              Add expense
            </Button>
            <Button variant="outline" asChild>
              <Link to="/groups">
                <Users className="mr-1 size-4" />
                Groups
              </Link>
            </Button>
          </div>

          {/* Groups list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Your groups</h2>
              <Link to="/groups" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border rounded-xl border border-border">
              {groups.slice(0, 5).map(group => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {group.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{group.name}</p>
                    {group.description && (
                      <p className="truncate text-xs text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />

      {addExpenseGroupId && (
        <CreateExpenseSheet
          groupId={addExpenseGroupId}
          open={!!addExpenseGroupId}
          onOpenChange={(open) => { if (!open) setAddExpenseGroupId(null) }}
        />
      )}
    </div>
  )
}
