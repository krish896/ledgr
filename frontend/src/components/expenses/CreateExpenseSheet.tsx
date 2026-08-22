import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatMoney, parseRupees } from '@/utils/money'
import { useGroupDetail } from '@/hooks/queries'
import api from '@/services/api'
import type { GroupMember } from '@/types/api'

const baseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required').max(500),
  payerId: z.string().min(1, 'Payer is required'),
  occurredAt: z.string().min(1, 'Date is required'),
  splitType: z.enum(['EQUAL', 'EXACT']),
  participantIds: z.array(z.string()).min(1, 'Select at least one participant'),
  exactSplits: z.array(z.object({ userId: z.string(), amount: z.string() })).optional(),
})

type FormValues = z.infer<typeof baseSchema>

interface Props {
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

function calcEqualSplits(totalPaise: number, ids: string[]): { userId: string; amount: number }[] {
  const sorted = [...ids].sort()
  const n = sorted.length
  const base = Math.floor(totalPaise / n)
  const remainder = totalPaise % n
  return sorted.map((userId, i) => ({ userId, amount: i < remainder ? base + 1 : base }))
}

export default function CreateExpenseSheet({ groupId, open, onOpenChange, onCreated }: Props) {
  const queryClient = useQueryClient()
  const { data: group } = useGroupDetail(groupId)
  const members: GroupMember[] = group?.members ?? []

  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      splitType: 'EQUAL',
      occurredAt: today,
      participantIds: [],
      exactSplits: [],
    },
  })

  const splitType = watch('splitType')
  const participantIds = watch('participantIds')
  const amountStr = watch('amount')
  const exactSplits = watch('exactSplits') ?? []

  const totalPaise = amountStr ? parseRupees(amountStr) : 0

  // Keep exactSplits in sync with participantIds
  useEffect(() => {
    if (splitType === 'EXACT') {
      const currentMap = new Map(exactSplits.map(s => [s.userId, s.amount]))
      const next = participantIds.map(id => ({
        userId: id,
        amount: currentMap.get(id) ?? '',
      }))
      setValue('exactSplits', next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantIds, splitType])

  const equalPreview = splitType === 'EQUAL' && totalPaise > 0 && participantIds.length > 0
    ? calcEqualSplits(totalPaise, participantIds)
    : []

  const exactTotal = exactSplits.reduce((sum, s) => sum + (parseRupees(s.amount) || 0), 0)
  const exactValid = splitType === 'EXACT' && exactTotal === totalPaise && totalPaise > 0

  function getMemberName(member: GroupMember) {
    return member.name ?? member.email
  }

  function toggleParticipant(userId: string, checked: boolean) {
    const current = participantIds
    if (checked) {
      setValue('participantIds', [...current, userId], { shouldValidate: true })
    } else {
      setValue('participantIds', current.filter(id => id !== userId), { shouldValidate: true })
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)

    if (splitType === 'EXACT') {
      const exactTotalCheck = (values.exactSplits ?? []).reduce((sum, s) => sum + (parseRupees(s.amount) || 0), 0)
      if (exactTotalCheck !== totalPaise) {
        setServerError(`Split amounts must equal ${formatMoney(totalPaise)}.`)
        return
      }
    }

    const body =
      splitType === 'EQUAL'
        ? {
            groupId,
            payerId: values.payerId,
            amount: totalPaise,
            description: values.description,
            occurredAt: values.occurredAt,
            splitType: 'EQUAL' as const,
            participants: values.participantIds,
          }
        : {
            groupId,
            payerId: values.payerId,
            amount: totalPaise,
            description: values.description,
            occurredAt: values.occurredAt,
            splitType: 'EXACT' as const,
            splits: (values.exactSplits ?? []).map(s => ({
              userId: s.userId,
              amount: parseRupees(s.amount),
            })),
          }

    try {
      await api.post('/expenses', body)
      await queryClient.invalidateQueries({ queryKey: ['groups'] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'expenses'] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'balances', false] })
      await queryClient.invalidateQueries({ queryKey: ['group', groupId, 'balances', true] })
      setSuccess(true)
      onCreated?.()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setServerError(e.message ?? 'Failed to create expense.')
    }
  }

  function handleClose() {
    reset({ splitType: 'EQUAL', occurredAt: today, participantIds: [], exactSplits: [] })
    setServerError(null)
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add expense</SheetTitle>
        </SheetHeader>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <p className="text-sm font-medium text-[hsl(var(--success))]">Expense added.</p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <form className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" noValidate>
              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="exp-amount">Amount (₹)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.amount}
                  {...register('amount')}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="exp-desc">Description</Label>
                <Input
                  id="exp-desc"
                  placeholder="Dinner, petrol, groceries…"
                  aria-invalid={!!errors.description}
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="exp-date">Date</Label>
                <Input id="exp-date" type="date" {...register('occurredAt')} />
              </div>

              {/* Paid by */}
              <div className="space-y-1.5">
                <Label>Paid by</Label>
                <Select onValueChange={(v) => setValue('payerId', v, { shouldValidate: true })}>
                  <SelectTrigger aria-invalid={!!errors.payerId}>
                    <SelectValue placeholder="Who paid?" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {getMemberName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payerId && <p className="text-xs text-destructive">{errors.payerId.message}</p>}
              </div>

              {/* Split type toggle */}
              <div className="space-y-1.5">
                <Label>Split type</Label>
                <div className="flex gap-2">
                  {(['EQUAL', 'EXACT'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('splitType', type)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                        splitType === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {type === 'EQUAL' ? 'Equal' : 'Exact'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-2">
                <Label>Participants</Label>
                {errors.participantIds && (
                  <p className="text-xs text-destructive">{errors.participantIds.message}</p>
                )}
                <div className="space-y-2">
                  {members.map(m => {
                    const checked = participantIds.includes(m.id)
                    const preview = equalPreview.find(p => p.userId === m.id)
                    const exactEntry = exactSplits.find(s => s.userId === m.id)
                    const exactIdx = exactSplits.findIndex(s => s.userId === m.id)

                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`participant-${m.id}`}
                          checked={checked}
                          onCheckedChange={(c) => toggleParticipant(m.id, !!c)}
                        />
                        <label
                          htmlFor={`participant-${m.id}`}
                          className="flex flex-1 items-center justify-between text-sm"
                        >
                          <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>
                            {getMemberName(m)}
                          </span>
                          {checked && splitType === 'EQUAL' && preview && (
                            <span className="text-money text-xs text-muted-foreground">
                              {formatMoney(preview.amount)}
                            </span>
                          )}
                        </label>
                        {checked && splitType === 'EXACT' && exactIdx >= 0 && (
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            className="h-7 w-24 text-right text-sm"
                            value={exactEntry?.amount ?? ''}
                            onChange={(e) => {
                              const next = [...exactSplits]
                              next[exactIdx] = { ...next[exactIdx], amount: e.target.value }
                              setValue('exactSplits', next)
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {splitType === 'EXACT' && participantIds.length > 0 && totalPaise > 0 && (
                  <div className={cn(
                    'mt-2 rounded-lg px-3 py-2 text-xs',
                    exactValid ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]' : 'bg-destructive/10 text-destructive'
                  )}>
                    {exactValid
                      ? `✓ Split totals ${formatMoney(totalPaise)}`
                      : `Split total ${formatMoney(exactTotal)} · must equal ${formatMoney(totalPaise)}`
                    }
                  </div>
                )}
              </div>

              {serverError && (
                <p role="alert" className="text-sm text-destructive">{serverError}</p>
              )}
            </form>

            <SheetFooter className="border-t border-border p-4">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || (splitType === 'EXACT' && !exactValid && participantIds.length > 0 && totalPaise > 0)}
              >
                {isSubmitting ? 'Adding…' : 'Add expense'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
