export default function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="text-2xl font-bold tracking-tight text-primary">Ledgr</span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full animate-loading rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
