import { Outlet } from 'react-router-dom'
import AppHeader from '@/components/shell/AppHeader'
import BottomNav from '@/components/shell/BottomNav'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 pb-[calc(var(--bottom-nav-height)+1.5rem)] sm:px-6 md:pb-6 lg:px-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
