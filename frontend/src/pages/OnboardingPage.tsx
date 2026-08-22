import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Receipt, Users, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { markOnboardingDone } from '@/utils/onboarding'

const slides = [
  {
    icon: Receipt,
    title: 'Track every expense',
    body: 'Log shared costs instantly — from dinner splits to group trips — with full detail and receipt photos.',
  },
  {
    icon: Users,
    title: 'Groups that stay organized',
    body: 'Create groups for flatmates, friends, or trips. Everyone sees the same ledger, no more chasing people.',
  },
  {
    icon: TrendingUp,
    title: 'See who owes what',
    body: 'Ledgr runs the maths and simplifies debts so the fewest number of payments settles everyone up.',
  },
  {
    icon: Zap,
    title: 'Settle in one tap',
    body: 'Generate a UPI link and get paid instantly. Every settlement is recorded and the balance updates live.',
  },
] as const

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const startX = useRef<number | null>(null)

  function finish() {
    markOnboardingDone()
    navigate('/auth/register', { replace: true })
  }

  function next() {
    if (current < slides.length - 1) {
      setCurrent(current + 1)
    } else {
      finish()
    }
  }

  function skip() {
    finish()
  }

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return
    const delta = startX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0 && current < slides.length - 1) setCurrent(current + 1)
      else if (delta < 0 && current > 0) setCurrent(current - 1)
    }
    startX.current = null
  }

  const isLast = current === slides.length - 1
  const slide = slides[current]
  const Icon = slide.icon

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button
          onClick={skip}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 flex size-20 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="size-10 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
          {slide.title}
        </h1>
        <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
          {slide.body}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-6 px-8 pb-12">
        {/* Dot indicators */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        <Button
          onClick={next}
          size="lg"
          className="w-full max-w-xs"
        >
          {isLast ? 'Get started' : 'Next'}
          {!isLast && <ChevronRight className="ml-1 size-4" />}
        </Button>

        {!isLast && (
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => {
                markOnboardingDone()
                navigate('/auth/login', { replace: true })
              }}
              className="text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
