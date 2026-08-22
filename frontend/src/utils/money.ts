/**
 * Formats a paise amount (BigInt-serialized string or integer) as ₹1,250.00.
 * Backend sends money fields derived from BigInt as strings.
 */
export function formatMoney(paise: string | number): string {
  const amount = typeof paise === 'string' ? parseInt(paise, 10) : paise
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100)
}
