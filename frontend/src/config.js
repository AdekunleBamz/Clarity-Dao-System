// Environment configuration with validation
// This module ensures required environment variables are present

const requiredEnvVars = [
  // Add required vars here when needed
]

const optionalEnvVars = [
  { key: 'VITE_WALLETCONNECT_PROJECT_ID', description: 'WalletConnect Project ID for wallet connections' },
  { key: 'VITE_STACKS_NETWORK', description: 'Stacks network (mainnet or testnet)', default: 'mainnet' },
  { key: 'VITE_STACKS_API_URL', description: 'Custom Stacks API endpoint' },
  { key: 'VITE_DEBUG', description: 'Enable debug logging', default: 'false' },
]

// Validate and get environment config
function getConfig() {
  const errors = []
  
  // Check required vars
  for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  }

  if (errors.length > 0) {
    console.error('Environment configuration errors:')
    errors.forEach(err => console.error(`  - ${err}`))
    throw new Error('Missing required environment variables. Check console for details.')
  }

  // Build config object
  return {
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
    stacksNetwork: import.meta.env.VITE_STACKS_NETWORK || 'mainnet',
    stacksApiUrl: import.meta.env.VITE_STACKS_API_URL || (
      import.meta.env.VITE_STACKS_NETWORK === 'testnet' 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so'
    ),
    debug: import.meta.env.VITE_DEBUG === 'true',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  }
}

// Export config singleton
export const config = getConfig()

// Helper to check if wallet connection is configured
export function isWalletConnectConfigured() {
  return Boolean(config.walletConnectProjectId)
}

// Debug logger
export function debugLog(...args) {
  if (config.debug || config.isDev) {
    console.log('[Clarity DAO]', ...args)
  }
}

// Contract addresses for deployed v5.1 contracts
export const CONTRACTS = {
  deployer: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
  daoToken: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.dao-token-v5-1',
  governance: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.governance-v5-1',
  treasury: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.treasury-v5-1',
  staking: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.staking-v5-1',
  bounty: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.bounty-v5-1',
  membershipNft: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.membership-nft-v5-1',
}

export default config
