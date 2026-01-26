/**
 * Application-wide constants and configuration
 * Centralized configuration for the Clarity DAO frontend
 */

// ============ Network Configuration ============

export const NETWORKS = {
  mainnet: {
    name: 'Stacks Mainnet',
    chainId: 1,
    url: 'https://api.hiro.so',
    explorerUrl: 'https://explorer.stacks.co',
    coreApiUrl: 'https://stacks-node-api.mainnet.stacks.co',
  },
  testnet: {
    name: 'Stacks Testnet',
    chainId: 2147483648,
    url: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.stacks.co/?chain=testnet',
    coreApiUrl: 'https://stacks-node-api.testnet.stacks.co',
  },
}

export const DEFAULT_NETWORK = 'mainnet'
export const CURRENT_NETWORK = NETWORKS[DEFAULT_NETWORK]

// ============ Contract Addresses ============

export const CONTRACTS = {
  mainnet: {
    deployer: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
    daoToken: 'dao-token-v5-1',
    governance: 'governance-v5-1',
    treasury: 'treasury-v5-1',
    staking: 'staking-v5-1',
    bounty: 'bounty-v5-1',
    membershipNft: 'membership-nft-v5-1',
  },
  testnet: {
    deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    daoToken: 'dao-token-v5-1',
    governance: 'governance-v5-1',
    treasury: 'treasury-v5-1',
    staking: 'staking-v5-1',
    bounty: 'bounty-v5-1',
    membershipNft: 'membership-nft-v5-1',
  },
}

/**
 * Get full contract identifier
 */
export function getContractId(contractName, network = DEFAULT_NETWORK) {
  const config = CONTRACTS[network]
  return `${config.deployer}.${config[contractName]}`
}

// ============ Token Configuration ============

export const TOKEN = {
  name: 'Clarity DAO Token',
  symbol: 'CDAO',
  decimals: 6,
  totalSupply: 1000000000, // 1 billion tokens
}

export const STX = {
  decimals: 6,
  symbol: 'STX',
}

/**
 * Convert micro units to display units
 */
export function fromMicro(amount, decimals = 6) {
  return Number(amount) / Math.pow(10, decimals)
}

/**
 * Convert display units to micro units
 */
export function toMicro(amount, decimals = 6) {
  return Math.floor(Number(amount) * Math.pow(10, decimals))
}

// ============ Staking Configuration ============

export const STAKING_TIERS = [
  { tier: 1, name: 'Bronze', minDays: 7, apy: 5, minStake: 10 },
  { tier: 2, name: 'Silver', minDays: 30, apy: 10, minStake: 100 },
  { tier: 3, name: 'Gold', minDays: 90, apy: 15, minStake: 500 },
  { tier: 4, name: 'Platinum', minDays: 180, apy: 20, minStake: 1000 },
  { tier: 5, name: 'Diamond', minDays: 365, apy: 25, minStake: 5000 },
]

export const STAKING_POOLS = [
  { id: 'governance', name: 'Governance Pool', description: 'Earn rewards for participating in governance', multiplier: 1 },
  { id: 'development', name: 'Development Pool', description: 'Support protocol development', multiplier: 1.2 },
  { id: 'community', name: 'Community Pool', description: 'Fund community initiatives', multiplier: 1.1 },
]

// ============ Governance Configuration ============

export const GOVERNANCE = {
  proposalMinimumTokens: 1000, // Minimum tokens to create proposal
  votingPeriodBlocks: 1440, // ~10 days at 10 min/block
  quorumPercentage: 10, // 10% of total supply must vote
  passingThreshold: 51, // 51% yes votes to pass
  executionDelay: 144, // ~1 day delay before execution
  maxActiveProposals: 10, // Maximum concurrent active proposals
}

export const PROPOSAL_TYPES = [
  { id: 'treasury', label: 'Treasury', description: 'Allocate funds from treasury' },
  { id: 'parameter', label: 'Parameter Change', description: 'Modify protocol parameters' },
  { id: 'upgrade', label: 'Contract Upgrade', description: 'Upgrade smart contracts' },
  { id: 'membership', label: 'Membership', description: 'Membership-related decisions' },
  { id: 'general', label: 'General', description: 'General governance proposals' },
]

export const PROPOSAL_STATUS = {
  draft: { label: 'Draft', color: 'gray' },
  active: { label: 'Active', color: 'blue' },
  passed: { label: 'Passed', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  executed: { label: 'Executed', color: 'purple' },
  expired: { label: 'Expired', color: 'yellow' },
}

// ============ Bounty Configuration ============

export const BOUNTY_STATUS = {
  open: { label: 'Open', color: 'green' },
  inProgress: { label: 'In Progress', color: 'blue' },
  review: { label: 'In Review', color: 'yellow' },
  completed: { label: 'Completed', color: 'purple' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  disputed: { label: 'Disputed', color: 'red' },
}

export const BOUNTY_CATEGORIES = [
  { id: 'development', label: 'Development', icon: '💻' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'documentation', label: 'Documentation', icon: '📝' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'community', label: 'Community', icon: '👥' },
  { id: 'security', label: 'Security', icon: '🔒' },
]

// ============ NFT Membership Tiers ============

export const MEMBERSHIP_TIERS = [
  { tier: 1, name: 'Member', color: '#6B7280', benefits: ['Basic voting rights'] },
  { tier: 2, name: 'Contributor', color: '#3B82F6', benefits: ['Proposal creation', 'Priority support'] },
  { tier: 3, name: 'Advocate', color: '#8B5CF6', benefits: ['Bounty review', 'Delegation rights'] },
  { tier: 4, name: 'Guardian', color: '#F59E0B', benefits: ['Treasury oversight', 'Emergency powers'] },
  { tier: 5, name: 'Legend', color: '#EF4444', benefits: ['All benefits', 'Lifetime membership'] },
]

// ============ UI Configuration ============

export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
}

export const TOAST = {
  defaultDuration: 5000,
  maxToasts: 5,
}

export const REFRESH_INTERVALS = {
  balance: 30000, // 30 seconds
  transactions: 60000, // 1 minute
  proposals: 120000, // 2 minutes
  blockHeight: 10000, // 10 seconds
}

// ============ API Configuration ============

export const API = {
  baseUrl: CURRENT_NETWORK.url,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  rateLimit: {
    maxRequests: 30,
    windowMs: 60000,
  },
}

// ============ Wallet Configuration ============

export const SUPPORTED_WALLETS = [
  { id: 'leather', name: 'Leather', icon: '🧥', downloadUrl: 'https://leather.io' },
  { id: 'xverse', name: 'Xverse', icon: '✖️', downloadUrl: 'https://xverse.app' },
  { id: 'hiro', name: 'Hiro Wallet', icon: '🔷', downloadUrl: 'https://hiro.so/wallet' },
]

// ============ Social Links ============

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/claritydao',
  discord: 'https://discord.gg/claritydao',
  github: 'https://github.com/AdekunleBamz/Clarity-Dao-System',
  docs: 'https://docs.claritydao.io',
}

// ============ Feature Flags ============

export const FEATURES = {
  enableStaking: true,
  enableBounties: true,
  enableDelegation: true,
  enableQuadraticVoting: true,
  enableConvictionVoting: true,
  enableNftMembership: true,
  enableStreamingPayments: true,
  enableRecurringPayments: true,
  enableAutoCompound: true,
}

export default {
  NETWORKS,
  DEFAULT_NETWORK,
  CURRENT_NETWORK,
  CONTRACTS,
  getContractId,
  TOKEN,
  STX,
  fromMicro,
  toMicro,
  STAKING_TIERS,
  STAKING_POOLS,
  GOVERNANCE,
  PROPOSAL_TYPES,
  PROPOSAL_STATUS,
  BOUNTY_STATUS,
  BOUNTY_CATEGORIES,
  MEMBERSHIP_TIERS,
  PAGINATION,
  TOAST,
  REFRESH_INTERVALS,
  API,
  SUPPORTED_WALLETS,
  SOCIAL_LINKS,
  FEATURES,
}
