/**
 * Stacks API Service
 * Centralized API calls for Stacks blockchain interactions
 */

const STACKS_API_URL = 'https://api.hiro.so'
const NETWORK = 'mainnet'

// Contract addresses
const CONTRACTS = {
  DAO_TOKEN: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.dao-token-v5-1',
  GOVERNANCE: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.governance-v5-1',
  TREASURY: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.treasury-v5-1',
  STAKING: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.staking-v5-1',
  BOUNTY: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.bounty-v5-1',
  MEMBERSHIP_NFT: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.membership-nft-v5-1',
}

// Rate limiting
let requestQueue = []
let isProcessing = false
const RATE_LIMIT_MS = 100 // 10 requests per second

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return
  
  isProcessing = true
  const { resolve, reject, request } = requestQueue.shift()
  
  try {
    const result = await request()
    resolve(result)
  } catch (error) {
    reject(error)
  }
  
  setTimeout(() => {
    isProcessing = false
    processQueue()
  }, RATE_LIMIT_MS)
}

function queueRequest(request) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, request })
    processQueue()
  })
}

/**
 * Base fetch with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${STACKS_API_URL}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Account & Balance APIs
 */
export const AccountAPI = {
  getBalance: async (address) => {
    return queueRequest(() => apiFetch(`/extended/v1/address/${address}/balances`))
  },

  getSTXBalance: async (address) => {
    const data = await AccountAPI.getBalance(address)
    return data.stx?.balance || '0'
  },

  getTransactions: async (address, { limit = 20, offset = 0 } = {}) => {
    return queueRequest(() => 
      apiFetch(`/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`)
    )
  },

  getNonce: async (address) => {
    const data = await queueRequest(() => apiFetch(`/extended/v1/address/${address}/nonces`))
    return data.possible_next_nonce
  },

  getAccountInfo: async (address) => {
    return queueRequest(() => apiFetch(`/v2/accounts/${address}`))
  },
}

/**
 * Contract APIs
 */
export const ContractAPI = {
  callReadOnly: async (contractId, functionName, args = []) => {
    const [address, name] = contractId.split('.')
    return queueRequest(() => 
      apiFetch(`/v2/contracts/call-read/${address}/${name}/${functionName}`, {
        method: 'POST',
        body: JSON.stringify({
          sender: address,
          arguments: args,
        }),
      })
    )
  },

  getContractSource: async (contractId) => {
    const [address, name] = contractId.split('.')
    return queueRequest(() => apiFetch(`/v2/contracts/source/${address}/${name}`))
  },

  getContractInterface: async (contractId) => {
    const [address, name] = contractId.split('.')
    return queueRequest(() => apiFetch(`/v2/contracts/interface/${address}/${name}`))
  },

  getContractEvents: async (contractId, { limit = 20, offset = 0 } = {}) => {
    const [address, name] = contractId.split('.')
    return queueRequest(() => 
      apiFetch(`/extended/v1/contract/${address}.${name}/events?limit=${limit}&offset=${offset}`)
    )
  },
}

/**
 * Transaction APIs
 */
export const TransactionAPI = {
  getById: async (txId) => {
    return queueRequest(() => apiFetch(`/extended/v1/tx/${txId}`))
  },

  getRecent: async ({ limit = 20, offset = 0 } = {}) => {
    return queueRequest(() => 
      apiFetch(`/extended/v1/tx?limit=${limit}&offset=${offset}`)
    )
  },

  getMempoolStats: async () => {
    return queueRequest(() => apiFetch('/extended/v1/tx/mempool/stats'))
  },

  broadcast: async (signedTx) => {
    return apiFetch('/v2/transactions', {
      method: 'POST',
      body: signedTx,
    })
  },
}

/**
 * Block APIs
 */
export const BlockAPI = {
  getRecent: async ({ limit = 20 } = {}) => {
    return queueRequest(() => apiFetch(`/extended/v1/block?limit=${limit}`))
  },

  getByHeight: async (height) => {
    return queueRequest(() => apiFetch(`/extended/v1/block/by_height/${height}`))
  },

  getByHash: async (hash) => {
    return queueRequest(() => apiFetch(`/extended/v1/block/${hash}`))
  },
}

/**
 * Token APIs
 */
export const TokenAPI = {
  getFungibleTokens: async (address) => {
    const data = await AccountAPI.getBalance(address)
    return data.fungible_tokens || {}
  },

  getNonFungibleTokens: async (address) => {
    const data = await AccountAPI.getBalance(address)
    return data.non_fungible_tokens || {}
  },

  getTokenHolders: async (contractId, { limit = 20, offset = 0 } = {}) => {
    return queueRequest(() => 
      apiFetch(`/extended/v1/tokens/ft/${contractId}/holders?limit=${limit}&offset=${offset}`)
    )
  },
}

/**
 * DAO-specific APIs
 */
export const DaoAPI = {
  // Governance
  getProposalCount: async () => {
    try {
      const result = await ContractAPI.callReadOnly(CONTRACTS.GOVERNANCE, 'get-proposal-count')
      return parseInt(result.result?.replace('0x', ''), 16) || 0
    } catch (error) {
      console.error('Failed to get proposal count:', error)
      return 0
    }
  },

  getProposal: async (proposalId) => {
    try {
      return await ContractAPI.callReadOnly(CONTRACTS.GOVERNANCE, 'get-proposal', [
        `0x${proposalId.toString(16).padStart(32, '0')}`
      ])
    } catch (error) {
      console.error(`Failed to get proposal ${proposalId}:`, error)
      return null
    }
  },

  // Treasury
  getTreasuryBalance: async () => {
    try {
      const [address] = CONTRACTS.TREASURY.split('.')
      const data = await AccountAPI.getBalance(address)
      return data.stx?.balance || '0'
    } catch (error) {
      console.error('Failed to get treasury balance:', error)
      return '0'
    }
  },

  // Staking
  getStakingStats: async () => {
    try {
      const result = await ContractAPI.callReadOnly(CONTRACTS.STAKING, 'get-total-staked')
      return {
        totalStaked: parseInt(result.result?.replace('0x', '') || '0', 16),
      }
    } catch (error) {
      console.error('Failed to get staking stats:', error)
      return { totalStaked: 0 }
    }
  },

  getUserStake: async (address) => {
    try {
      return await ContractAPI.callReadOnly(CONTRACTS.STAKING, 'get-stake', [
        `0x${Buffer.from(address).toString('hex')}`
      ])
    } catch (error) {
      console.error(`Failed to get stake for ${address}:`, error)
      return null
    }
  },

  // Token
  getTokenBalance: async (address) => {
    try {
      const tokens = await TokenAPI.getFungibleTokens(address)
      return tokens[`${CONTRACTS.DAO_TOKEN}::dao-token`]?.balance || '0'
    } catch (error) {
      console.error(`Failed to get token balance for ${address}:`, error)
      return '0'
    }
  },

  getTotalSupply: async () => {
    try {
      const result = await ContractAPI.callReadOnly(CONTRACTS.DAO_TOKEN, 'get-total-supply')
      return result.result?.replace('0x', '') || '0'
    } catch (error) {
      console.error('Failed to get total supply:', error)
      return '0'
    }
  },
}

/**
 * Network Info
 */
export const NetworkAPI = {
  getInfo: async () => {
    return apiFetch('/v2/info')
  },

  getStatus: async () => {
    return queueRequest(() => apiFetch('/extended/v1/status'))
  },

  getPoxInfo: async () => {
    return queueRequest(() => apiFetch('/v2/pox'))
  },
}

// Export contracts for use in components
export { CONTRACTS, STACKS_API_URL, NETWORK }

export default {
  Account: AccountAPI,
  Contract: ContractAPI,
  Transaction: TransactionAPI,
  Block: BlockAPI,
  Token: TokenAPI,
  Dao: DaoAPI,
  Network: NetworkAPI,
  CONTRACTS,
  STACKS_API_URL,
  NETWORK,
}
