import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney, parseRupees } from '@/utils/money'
import api from '@/services/api'
import type { GroupMember } from '@/types/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  toUser: GroupMember
  outstandingPaise: string
}

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  note: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

export default function SettlementDialog({ open, onOpenChange, groupId, toUser, outstandingPaise }: Props) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const outstandingRupees = (parseInt(outstandingPaise, 10) / 100).toFixed(2)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: outstandingRupees },
  })

  const amountValue = watch('amount')
  const enteredPaise = amountValue ? parseRupees(amountValue) : 0
  const remainingPaise = parseInt(outstandingPaise, 10) - enteredPaise
  const isPartial = remainingPaise > 0 && enteredPaise > 0

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const paise = parseRupees(values.amount)
    if (paise <= 0) {
      setServerError('Amount must be greater than zero.')
      return
    }
    try {
      await api.post('/settlements', {
        groupId,
        toUserId: toUser.id,
        amount: paise,
        note: values.note || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'balances', false] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'balances', true] })
      setSuccess(true)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setServerError(e.message ?? 'Settlement failed.')
    }
  }

  function handleClose() {
    reset({ amount: outstandingRupees })
    setServerError(null)
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settle with {toUser.name ?? toUser.email}</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-medium text-[hsl(var(--success))]">Settlement recorded.</p>
            <p className="mt-1 text-sm text-muted-foreground">Balances have been updated.</p>
            <Button className="mt-4" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 px-4">
              <div className="rounded-lg bg-[hsl(var(--surface))] px-4 py-3 text-sm">
                <span className="text-muted-foreground">You owe </span>
                <span className="font-semibold text-foreground">{toUser.name ?? toUser.email}</span>
                <span className="ml-1 font-semibold text-[hsl(var(--debit))]">{formatMoney(outstandingPaise)}</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settle-amount">Amount (₹)</Label>
                <Input
                  id="settle-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  aria-invalid={!!errors.amount}
                  {...register('amount')}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
                {isPartial && enteredPaise > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Remaining after this: {formatMoney(remainingPaise.toString())}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settle-note">
                  Note <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input id="settle-note" placeholder="UPI, cash, etc." {...register('note')} />
              </div>

              {serverError && (
                <p role="alert" className="text-sm text-destructive">{serverError}</p>
              )}
            </div>
            <DialogFooter className="px-4 pb-4">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? 'Settling…' : 'Record settlement'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
