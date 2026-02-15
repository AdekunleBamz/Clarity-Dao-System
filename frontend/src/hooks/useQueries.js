/**
 * React Query Hooks for Stacks DAO System
 * Centralized data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AccountAPI } from '../services/api'

const QUERY_KEYS = {
  balances: ['balances'],
  transactions: ['transactions'],
  proposals: ['proposals'],
  userData: ['userData']
}

/**
 * Fetch user STX balance
 */
export function useSTXBalance(address) {
  return useQuery({
    queryKey: [...QUERY_KEYS.balances, address],
    queryFn: () => AccountAPI.getSTXBalance(address),
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    retry: 2
  })
}

/**
 * Fetch user DAO token balance
 */
export function useDAOBalance(address) {
  return useQuery({
    queryKey: [...QUERY_KEYS.balances, 'dao', address],
    queryFn: async () => {
      const balances = await AccountAPI.getBalance(address)
      return balances.fungible_tokens || {}
    },
    enabled: !!address,
    staleTime: 30000,
    retry: 2
  })
}

/**
 * Fetch user transaction history
 */
export function useTransactionHistory(address, options = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.transactions, address, options.limit || 20],
    queryFn: () => AccountAPI.getTransactions(address, options),
    enabled: !!address,
    staleTime: 60000,
    retry: 2
  })
}

/**
 * Fetch account info
 */
export function useAccountInfo(address) {
  return useQuery({
    queryKey: [...QUERY_KEYS.userData, address],
    queryFn: () => AccountAPI.getAccountInfo(address),
    enabled: !!address,
    staleTime: 60000,
    retry: 1
  })
}

/**
 * Refetch balances on transaction
 */
export function useRefreshBalances() {
  const queryClient = useQueryClient()

  return {
    invalidateBalances: (address) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.balances, address]
      })
    },
    invalidateTransactions: (address) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.transactions, address]
      })
    },
    invalidateAll: (address) => {
      queryClient.invalidateQueries()
    }
  }
}
