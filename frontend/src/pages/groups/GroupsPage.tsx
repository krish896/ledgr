import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { useGroups, useGroupsWithBalances } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import CreateGroupDialog from '@/components/groups/CreateGroupDialog'
import type { GroupSummary } from '@/types/api'

type Filter = 'all' | 'unsettled'

export default function GroupsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: groups = [], isLoading, isError } = useGroups()

  const balanceQueries = useGroupsWithBalances(
    filter === 'unsettled' ? groups.map(g => g.id) : []
  )

  const filtered = groups.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'unsettled') {
      const idx = groups.indexOf(g)
      const balanceData = balanceQueries[idx]?.data
      if (!balanceData || balanceData.length === 0) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Groups</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search groups…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['all', 'unsettled'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'border-b-2 px-3 pb-2 text-sm font-medium capitalize transition-colors',
              filter === f
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? 'All' : 'Unsettled'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load groups.</p>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--surface))] py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="size-7 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mb-1 text-base font-semibold text-foreground">No groups yet</h2>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Groups let you track shared expenses with friends, flatmates, or travel companions.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            Create a group
          </Button>
        </div>
      )}

      {!isLoading && !isError && groups.length > 0 && filtered.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? `No groups matching "${search}"` : 'No unsettled groups.'}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border">
          {filtered.map(group => (
            <GroupRow
              key={group.id}
              group={group}
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))}
        </div>
      )}

      {/* Floating create button */}
      {groups.length > 0 && (
        <button
          onClick={() => setCreateOpen(true)}
          aria-label="Create group"
          className="fixed bottom-[calc(var(--bottom-nav-height)+1.5rem)] left-1/2 -translate-x-1/2 md:bottom-8 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          New group
        </button>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function GroupRow({ group, onClick }: { group: GroupSummary; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
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
    </button>
  )
}
