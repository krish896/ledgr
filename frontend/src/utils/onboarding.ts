const KEY = 'ledgr_onboarding_completed'

export function isOnboardingDone(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function markOnboardingDone(): void {
  localStorage.setItem(KEY, 'true')
}
