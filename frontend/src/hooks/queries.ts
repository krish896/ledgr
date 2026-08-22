import { useQuery, useQueries } from '@tanstack/react-query'
import api from '@/services/api'
import type {
  GetGroupsResponse,
  GetGroupResponse,
  GetBalancesResponse,
  GetGroupExpensesResponse,
  GetExpenseResponse,
} from '@/types/api'

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await api.get<GetGroupsResponse>('/groups')
      return data.groups
    },
  })
}

export function useGroupDetail(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data } = await api.get<GetGroupResponse>(`/groups/${groupId}`)
      return data.group
    },
    enabled: !!groupId,
  })
}

export function useGroupBalances(groupId: string, simplified: boolean) {
  return useQuery({
    queryKey: ['group', groupId, 'balances', simplified],
    queryFn: async () => {
      const params = simplified ? '?simplified=true' : ''
      const { data } = await api.get<GetBalancesResponse>(`/groups/${groupId}/balances${params}`)
      return data.balances
    },
    enabled: !!groupId,
  })
}

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId, 'expenses'],
    queryFn: async () => {
      const { data } = await api.get<GetGroupExpensesResponse>(`/groups/${groupId}/expenses`)
      return data.expenses
    },
    enabled: !!groupId,
  })
}

export function useExpenseDetail(expenseId: string) {
  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const { data } = await api.get<GetExpenseResponse>(`/expenses/${expenseId}`)
      return data.expense
    },
    enabled: !!expenseId,
  })
}

export function useGroupsWithBalances(groupIds: string[]) {
  return useQueries({
    queries: groupIds.map((groupId) => ({
      queryKey: ['group', groupId, 'balances', false] as const,
      queryFn: async () => {
        const { data } = await api.get<GetBalancesResponse>(`/groups/${groupId}/balances`)
        return data.balances
      },
      enabled: groupIds.length > 0,
    })),
  })
}
