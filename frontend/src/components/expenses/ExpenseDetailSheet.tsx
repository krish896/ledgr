import { useState } from 'react'
import { MoreVertical, Trash2, Receipt as ReceiptIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { formatMoney } from '@/utils/money'
import { useExpenseDetail } from '@/hooks/queries'
import DeleteExpenseDialog from './DeleteExpenseDialog'

interface Props {
  expenseId: string | null
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function ExpenseDetailSheet({ expenseId, groupId, open, onOpenChange, onDeleted }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: expense, isLoading, isError } = useExpenseDetail(expenseId ?? '')

  function handleDeleted() {
    setDeleteOpen(false)
    onOpenChange(false)
    onDeleted()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="flex-row items-center justify-between pr-8">
            <SheetTitle>Expense detail</SheetTitle>
            {expense && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Expense actions">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 />
                    Delete expense
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 w-3/4 rounded bg-muted" />
                <div className="h-8 w-1/2 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </div>
            )}

            {isError && (
              <p className="text-sm text-destructive">Failed to load expense.</p>
            )}

            {expense && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{expense.description}</h2>
                  <p className="text-money mt-1 text-2xl font-bold text-foreground">
                    {formatMoney(expense.amount)}
                  </p>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Paid by </span>
                  <span className="font-medium text-foreground">
                    {expense.participants.find(p => p.user.id === expense.payerId)?.user.name
                      ?? expense.participants.find(p => p.user.id === expense.payerId)?.user.email
                      ?? 'Unknown'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Split
                  </p>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {expense.participants.map((p) => (
                      <div key={p.user.id} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-foreground">
                          {p.user.name ?? p.user.email}
                        </span>
                        <span className="text-money text-sm font-medium text-foreground">
                          {formatMoney(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Date
                  </p>
                  <p className="text-sm text-foreground">
                    {new Date(expense.occurredAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {expense.receiptImageUrl && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ReceiptIcon className="size-4" />
                    Receipt attached
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {expense && deleteOpen && (
        <DeleteExpenseDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          expenseId={expense.id}
          groupId={groupId}
          description={expense.description}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
