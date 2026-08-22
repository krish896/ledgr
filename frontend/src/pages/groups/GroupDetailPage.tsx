import { useState } from 'react'
import { Link, Navigate, Outlet, useParams } from 'react-router-dom'
import { ArrowLeft, Menu, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGroupDetail } from '@/hooks/queries'
import GroupDrawer from '@/components/groups/GroupDrawer'
import CreateExpenseSheet from '@/components/expenses/CreateExpenseSheet'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const { data: group, isLoading } = useGroupDetail(groupId ?? '')

  if (!groupId) return <Navigate to="/groups" replace />

  return (
    <div className="space-y-0">
      {/* Group header */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/groups"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Groups</span>
        </Link>

        <div className="flex-1 text-center">
          {isLoading ? (
            <div className="mx-auto h-5 w-32 animate-pulse rounded bg-muted" />
          ) : (
            <div>
              <h1 className="text-base font-semibold text-foreground">{group?.name}</h1>
              {group?.members && (
                <p className="text-xs text-muted-foreground">
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu />
        </Button>
      </div>

      {/* Child route content */}
      <Outlet />

      {/* Floating add expense button */}
      <button
        onClick={() => setAddExpenseOpen(true)}
        aria-label="Add expense"
        className="fixed bottom-[calc(var(--bottom-nav-height)+1.5rem)] left-1/2 -translate-x-1/2 md:bottom-8 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        <Plus className="size-4" />
        Add expense
      </button>

      <GroupDrawer
        groupId={groupId}
        groupName={group?.name ?? ''}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <CreateExpenseSheet
        groupId={groupId}
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
      />
    </div>
  )
}
