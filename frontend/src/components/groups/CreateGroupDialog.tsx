import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import api from '@/services/api'
import type { CreateGroupResponse } from '@/types/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateGroupDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const { data } = await api.post<CreateGroupResponse>('/groups', {
        name: values.name,
        description: values.description || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['groups'] })
      reset()
      onOpenChange(false)
      navigate(`/groups/${data.group.id}`)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setServerError(e.message ?? 'Failed to create group.')
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
      setServerError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              placeholder="Goa Trip, Flat 4B, etc."
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="group-description"
              placeholder="What's this group for?"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">{serverError}</p>
          )}
        </form>
        <DialogFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
