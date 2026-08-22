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

// Converts user-entered rupees string ("500.00") to integer paise (50000)
export function parseRupees(input: string): number {
  return Math.round(parseFloat(input) * 100)
}
