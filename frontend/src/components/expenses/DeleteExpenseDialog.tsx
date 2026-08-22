import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import api from '@/services/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseId: string
  groupId: string
  description: string
  onDeleted: () => void
}

export default function DeleteExpenseDialog({ open, onOpenChange, expenseId, groupId, description, onDeleted }: Props) {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await api.delete(`/expenses/${expenseId}`)
      await queryClient.invalidateQueries({ queryKey: ['groups'] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'expenses'] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'balances', false] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'balances', true] })
      queryClient.removeQueries({ queryKey: ['expense', expenseId] })
      onOpenChange(false)
      onDeleted()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message ?? 'Failed to delete expense.')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete expense?</DialogTitle>
        </DialogHeader>
        <div className="px-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">"{description}"</span> will be removed
            from this group. This cannot be undone.
          </p>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
