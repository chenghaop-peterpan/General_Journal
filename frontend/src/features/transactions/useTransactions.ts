import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { callApi } from '../../api/client'
import { useAuth } from '../../auth/AuthProvider'
import type { Category, Transaction } from '../../types'

const KEYS = {
  transactions: (from?: string, to?: string) => ['transactions', from ?? '', to ?? ''] as const,
  categories: ['categories'] as const,
}

export function useTransactions(params: { from?: string; to?: string } = {}) {
  const { idToken } = useAuth()
  return useQuery({
    enabled: !!idToken,
    queryKey: KEYS.transactions(params.from, params.to),
    queryFn: () => callApi<Transaction[]>('listTransactions', params, idToken),
  })
}

export function useCategories() {
  const { idToken } = useAuth()
  return useQuery({
    enabled: !!idToken,
    queryKey: KEYS.categories,
    queryFn: () => callApi<Category[]>('listCategories', {}, idToken),
    staleTime: 5 * 60_000,
  })
}

export function useCreateTransaction() {
  const { idToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Transaction, 'id' | 'createdAt' | 'userEmail'>) =>
      callApi<Transaction>('createTransaction', input, idToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useUpdateTransaction() {
  const { idToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string } & Partial<Omit<Transaction, 'id' | 'createdAt' | 'userEmail'>>) =>
      callApi<Transaction>('updateTransaction', input, idToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useDeleteTransaction() {
  const { idToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => callApi<{ id: string }>('deleteTransaction', { id }, idToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}
