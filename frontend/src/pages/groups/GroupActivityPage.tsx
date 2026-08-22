import { Clock } from 'lucide-react'

export default function GroupActivityPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Clock className="mb-3 size-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">Activity</p>
      <p className="mt-1 text-xs text-muted-foreground">Coming in a later phase.</p>
    </div>
  )
}
