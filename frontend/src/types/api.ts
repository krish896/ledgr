// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string | null
  upiId: string | null
  profileCompleted: boolean
  createdAt: string
  updatedAt: string
}

// POST /auth/register  → { user }
// POST /auth/login     → { user }
// GET  /auth/me        → { user }
// PATCH /auth/me       → { user }
export interface AuthResponse {
  user: User
}

export interface LogoutResponse {
  message: string
}

// ─── Groups ──────────────────────────────────────────────────────────────────

// Returned by: POST /groups, GET /groups items, PATCH /groups/:groupId
export interface GroupSummary {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  email: string
  name: string | null
}

// Returned by: GET /groups/:groupId only
export interface GroupDetail extends GroupSummary {
  members: GroupMember[]
}

export interface CreateGroupResponse {
  group: GroupSummary
}

export interface GetGroupsResponse {
  groups: GroupSummary[]
}

export interface GetGroupResponse {
  group: GroupDetail
}

export interface UpdateGroupResponse {
  group: GroupSummary
}

export interface AddMemberResponse {
  member: GroupMember
}

// ─── Balances ────────────────────────────────────────────────────────────────

// amount is BigInt-serialized → arrives as string
export interface Balance {
  fromUserId: string
  toUserId: string
  amount: string
}

// GET /groups/:groupId/balances
export interface GetBalancesResponse {
  balances: Balance[]
  simplified?: true
}

// ─── UPI ─────────────────────────────────────────────────────────────────────

// POST /groups/:groupId/upi-link
// amount here is a plain JS number (paise), not a BigInt string
export interface UpiLinkResponse {
  upiLink: string
  recipient: {
    id: string
    name: string | null
    upiId: string
  }
  amount: number
  groupId: string
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type SplitType = 'EQUAL' | 'EXACT'

// Returned by: POST /expenses (no participants)
export interface ExpenseSummary {
  id: string
  groupId: string
  payerId: string
  amount: string       // BigInt-serialized
  description: string
  splitType: SplitType
  occurredAt: string
  receiptImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseParticipant {
  user: {
    id: string
    name: string | null
    email: string
  }
  amount: string       // BigInt-serialized
}

// Returned by: GET /expenses/:expenseId (includes participants)
export interface ExpenseDetail extends ExpenseSummary {
  participants: ExpenseParticipant[]
}

export interface CreateExpenseResponse {
  expense: ExpenseSummary
}

export interface GetExpenseResponse {
  expense: ExpenseDetail
}

export interface DeleteExpenseResponse {
  message: string
}

// ─── Receipts ────────────────────────────────────────────────────────────────

// POST /expenses/receipts
export interface UploadReceiptResponse {
  receiptId: string
  receiptImageUrl: string
}

// ─── OCR ─────────────────────────────────────────────────────────────────────

// POST /expenses/ocr
// amount is a plain integer (paise), not a BigInt string
export interface OcrDraft {
  description: string
  amount: number       // plain integer paise (Math.round(rupees * 100))
  occurredAt: string   // YYYY-MM-DD
  receiptImageUrl: string
}

export interface OcrDraftResponse {
  draft: OcrDraft
}

// ─── Settlements ─────────────────────────────────────────────────────────────

// POST /settlements
export interface Settlement {
  id: string
  groupId: string
  fromUserId: string
  toUserId: string
  amount: string       // BigInt-serialized
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSettlementResponse {
  settlement: Settlement
}

// ─── API Errors ──────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  status?: number
}
