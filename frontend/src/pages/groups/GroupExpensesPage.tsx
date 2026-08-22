import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useGroupExpenses } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { Receipt } from 'lucide-react'
import ExpenseDetailSheet from '@/components/expenses/ExpenseDetailSheet'
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog'
import type { GroupExpenseItem } from '@/types/api'

type Filter = 'all' | 'involving-me'

export default function GroupExpensesPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { currentUser } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [contextExpense, setContextExpense] = useState<GroupExpenseItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: expenses = [], isLoading, isError, refetch } = useGroupExpenses(groupId ?? '')

  if (!groupId) return null

  const filtered = expenses.filter(e => {
    if (filter === 'involving-me' && currentUser) {
      return e.payerId === currentUser.id || e.participantIds.includes(currentUser.id)
    }
    return true
  })

  function openDetail(expenseId: string) {
    setSelectedExpenseId(expenseId)
    setDetailOpen(true)
  }

  function openContextMenu(expense: GroupExpenseItem) {
    setContextExpense(expense)
    setDeleteOpen(true)
  }

  function handleTouchStart(expense: GroupExpenseItem) {
    longPressTimer.current = setTimeout(() => {
      openContextMenu(expense)
    }, 500)
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleContextMenu(e: React.MouseEvent, expense: GroupExpenseItem) {
    e.preventDefault()
    openContextMenu(expense)
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {([['all', 'All'], ['involving-me', 'Involving me']] as [Filter, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'border-b-2 px-3 pb-2 text-sm font-medium transition-colors',
              filter === f
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div className="py-8 text-center">
          <p className="text-sm text-destructive">Failed to load expenses.</p>
          <button onClick={() => void refetch()} className="mt-2 text-sm text-primary hover:underline">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && expenses.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-[hsl(var(--surface))] py-12 text-center">
          <Receipt className="mx-auto mb-3 size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">No expenses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add the first expense to get started.</p>
        </div>
      )}

      {!isLoading && !isError && expenses.length > 0 && filtered.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No expenses involving you.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border">
          {filtered.map(expense => (
            <button
              key={expense.id}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
              onClick={() => openDetail(expense.id)}
              onTouchStart={() => handleTouchStart(expense)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onContextMenu={e => handleContextMenu(e, expense)}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {new Date(expense.occurredAt).getDate()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  Paid by {expense.payer.name ?? expense.payer.email}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-money text-sm font-semibold text-foreground">
                  {formatMoney(expense.amount)}
                </p>
                {expense.receiptImageUrl && (
                  <Receipt className="ml-auto mt-0.5 size-3 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <ExpenseDetailSheet
        expenseId={selectedExpenseId}
        groupId={groupId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDeleted={() => setDetailOpen(false)}
      />

      {contextExpense && (
        <DeleteExpenseDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setContextExpense(null)
          }}
          expenseId={contextExpense.id}
          groupId={groupId}
          description={contextExpense.description}
          onDeleted={() => {
            setDeleteOpen(false)
            setContextExpense(null)
          }}
        />
      )}
    </div>
  )
}
