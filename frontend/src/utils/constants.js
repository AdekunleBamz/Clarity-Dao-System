/**
 * Application-wide constants and configuration
 */

// Network configuration
export const NETWORK = {
  MAINNET: {
    name: 'mainnet',
    apiUrl: 'https://api.hiro.so',
    explorerUrl: 'https://explorer.stacks.co',
    chainId: 1,
  },
  TESTNET: {
    name: 'testnet',
    apiUrl: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.stacks.co/?chain=testnet',
    chainId: 2147483648,
  },
}

export const CURRENT_NETWORK = NETWORK.MAINNET

// Deployed contract addresses (mainnet)
export const CONTRACTS = {
  DAO_TOKEN: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.dao-token-v5-1',
  GOVERNANCE: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.governance-v5-1',
  TREASURY: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.treasury-v5-1',
  STAKING: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.staking-v5-1',
  BOUNTY: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.bounty-v5-1',
  MEMBERSHIP_NFT: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.membership-nft-v5-1',
}

// Staking tiers configuration
export const STAKING_TIERS = [
  { tier: 1, name: 'Bronze', minStake: 100, apy: 5, lockDays: 7, icon: '🥉' },
  { tier: 2, name: 'Silver', minStake: 1000, apy: 10, lockDays: 30, icon: '🥈' },
  { tier: 3, name: 'Gold', minStake: 5000, apy: 15, lockDays: 90, icon: '🥇' },
  { tier: 4, name: 'Platinum', minStake: 10000, apy: 20, lockDays: 180, icon: '💎' },
  { tier: 5, name: 'Diamond', minStake: 50000, apy: 25, lockDays: 365, icon: '👑' },
]

// Membership NFT tiers
export const MEMBERSHIP_TIERS = [
  { tier: 1, name: 'Bronze', price: 100, maxSupply: 1000 },
  { tier: 2, name: 'Silver', price: 500, maxSupply: 500 },
  { tier: 3, name: 'Gold', price: 1500, maxSupply: 200 },
  { tier: 4, name: 'Platinum', price: 5000, maxSupply: 50 },
  { tier: 5, name: 'Diamond', price: 15000, maxSupply: 10 },
]

// Proposal status mapping
export const PROPOSAL_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
}

export const PROPOSAL_STATUS_LABELS = {
  [PROPOSAL_STATUS.DRAFT]: 'Draft',
  [PROPOSAL_STATUS.ACTIVE]: 'Active',
  [PROPOSAL_STATUS.PASSED]: 'Passed',
  [PROPOSAL_STATUS.REJECTED]: 'Rejected',
  [PROPOSAL_STATUS.EXECUTED]: 'Executed',
  [PROPOSAL_STATUS.CANCELLED]: 'Cancelled',
  [PROPOSAL_STATUS.EXPIRED]: 'Expired',
}

// Bounty status
export const BOUNTY_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'inProgress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
}

// Governance configuration
export const GOVERNANCE = {
  MIN_PROPOSAL_THRESHOLD: 1000, // Minimum tokens to create proposal
  VOTING_PERIOD_BLOCKS: 4320, // ~3 days at 10 min/block
  EXECUTION_DELAY_BLOCKS: 1440, // ~1 day grace period
  QUORUM_PERCENTAGE: 10, // 10% of total supply
}

// Token configuration
export const TOKEN = {
  NAME: 'Clarity DAO Token',
  SYMBOL: 'DAO',
  DECIMALS: 6,
  TOTAL_SUPPLY: 100_000_000,
}

// API endpoints
export const API = {
  HIRO_API: 'https://api.hiro.so',
  PRICE_API: 'https://api.coingecko.com/api/v3',
}

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'clarity-dao-theme',
  WALLET_SESSION: 'clarity-dao-wallet-session',
  SETTINGS: 'clarity-dao-settings',
  RECENT_TRANSACTIONS: 'clarity-dao-recent-txs',
}

// UI configuration
export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 10,
  MAX_RECENT_TRANSACTIONS: 20,
}

// Social links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/ClarityDAO',
  DISCORD: 'https://discord.gg/clarityDAO',
  GITHUB: 'https://github.com/AdekunleBamz/Clarity-Dao-System',
  DOCS: 'https://docs.claritydao.xyz',
}

// Helper to get explorer URL for transaction
export function getExplorerTxUrl(txId) {
  return `${CURRENT_NETWORK.explorerUrl}/txid/${txId}?chain=${CURRENT_NETWORK.name}`
}

// Helper to get explorer URL for address
export function getExplorerAddressUrl(address) {
  return `${CURRENT_NETWORK.explorerUrl}/address/${address}?chain=${CURRENT_NETWORK.name}`
}

// Helper to get explorer URL for contract
export function getExplorerContractUrl(contractId) {
  return `${CURRENT_NETWORK.explorerUrl}/txid/${contractId}?chain=${CURRENT_NETWORK.name}`
}

export default {
  NETWORK,
  CURRENT_NETWORK,
  CONTRACTS,
  STAKING_TIERS,
  MEMBERSHIP_TIERS,
  PROPOSAL_STATUS,
  BOUNTY_STATUS,
  GOVERNANCE,
  TOKEN,
  API,
  STORAGE_KEYS,
  UI,
  SOCIAL_LINKS,
}
