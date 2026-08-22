import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useGroupBalances, useGroupDetail } from '@/hooks/queries'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import SettlementDialog from '@/components/groups/SettlementDialog'
import type { GroupMember, Balance } from '@/types/api'

export default function GroupBalancesPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { currentUser } = useAuth()
  const [simplified, setSimplified] = useState(false)
  const [settleTarget, setSettleTarget] = useState<{ member: GroupMember; balance: Balance } | null>(null)

  const { data: group } = useGroupDetail(groupId ?? '')
  const { data: balances = [], isLoading, isError } = useGroupBalances(groupId ?? '', simplified)

  const memberMap = new Map(group?.members.map(m => [m.id, m]) ?? [])

  function getMemberName(id: string) {
    const m = memberMap.get(id)
    return m?.name ?? m?.email ?? id
  }

  if (!groupId) return null

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit">
        {[false, true].map(s => (
          <button
            key={String(s)}
            onClick={() => setSimplified(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              simplified === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s ? 'Simplified' : 'All debts'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive">Failed to load balances.</p>
      )}

      {/* Empty */}
      {!isLoading && !isError && balances.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-[hsl(var(--surface))] py-12 text-center">
          <p className="text-sm font-medium text-foreground">All settled up</p>
          <p className="mt-1 text-xs text-muted-foreground">No outstanding balances in this group.</p>
        </div>
      )}

      {/* Balance rows */}
      {!isLoading && balances.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border">
          {balances.map((b, i) => {
            const isOwedToMe = b.toUserId === currentUser?.id
            const iOwe = b.fromUserId === currentUser?.id
            const fromName = getMemberName(b.fromUserId)
            const toName = getMemberName(b.toUserId)
            const toMember = memberMap.get(b.toUserId)

            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <span className={cn(
                    'font-medium',
                    iOwe ? 'text-[hsl(var(--debit))]' : 'text-foreground'
                  )}>
                    {fromName}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className={cn(
                    'font-medium',
                    isOwedToMe ? 'text-[hsl(var(--success))]' : 'text-foreground'
                  )}>
                    {toName}
                  </span>
                </div>
                <span className={cn(
                  'text-money shrink-0 text-sm font-semibold',
                  isOwedToMe ? 'text-[hsl(var(--success))]' : iOwe ? 'text-[hsl(var(--debit))]' : 'text-foreground'
                )}>
                  {formatMoney(b.amount)}
                </span>
                {iOwe && toMember && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setSettleTarget({ member: toMember, balance: b })}
                  >
                    Settle
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {settleTarget && (
        <SettlementDialog
          open={!!settleTarget}
          onOpenChange={(open) => { if (!open) setSettleTarget(null) }}
          groupId={groupId}
          toUser={settleTarget.member}
          outstandingPaise={settleTarget.balance.amount}
        />
      )}
    </div>
  )
}
