import { Link } from 'react-router-dom'
import NavLink from './NavLink'
import UserMenu from './UserMenu'

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-[var(--header-height)] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="text-xl font-bold tracking-tight text-primary"
        >
          Ledgr
        </Link>

        <nav className="hidden h-full items-center md:flex">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/groups">Groups</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>

        <UserMenu />
      </div>
    </header>
  )
}
