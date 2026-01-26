import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'

const WalletContext = createContext(null)

const DEPLOYER = 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N'

// Contract addresses for v5.1 deployed contracts
const CONTRACTS = {
  daoToken: `${DEPLOYER}.dao-token-v5-1`,
  governance: `${DEPLOYER}.governance-v5-1`,
  treasury: `${DEPLOYER}.treasury-v5-1`,
  staking: `${DEPLOYER}.staking-v5-1`,
  bounty: `${DEPLOYER}.bounty-v5-1`,
  membershipNft: `${DEPLOYER}.membership-nft-v5-1`,
}

// Stacks API endpoints
const STACKS_API = {
  mainnet: 'https://api.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [session, setSession] = useState(null)
  const [provider, setProvider] = useState(null)
  const [wcUri, setWcUri] = useState(null)
  const [network, setNetwork] = useState('mainnet')
  const [stxBalance, setStxBalance] = useState(null)
  const [daoBalance, setDaoBalance] = useState(null)

  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
  const apiBase = STACKS_API[network]

  // Fetch balances when address changes
  useEffect(() => {
    if (!address) {
      setStxBalance(null)
      setDaoBalance(null)
      return
    }

    const fetchBalances = async () => {
      try {
        // Fetch STX balance
        const accountRes = await fetch(`${apiBase}/extended/v1/address/${address}/stx`)
        if (accountRes.ok) {
          const data = await accountRes.json()
          setStxBalance(parseInt(data.balance) / 1_000_000) // Convert from micro-STX
        }

        // Fetch DAO token balance (FT balance)
        const ftRes = await fetch(`${apiBase}/extended/v1/address/${address}/balances`)
        if (ftRes.ok) {
          const data = await ftRes.json()
          const daoTokenKey = Object.keys(data.fungible_tokens || {}).find(k => 
            k.includes('dao-token-v5-1')
          )
          if (daoTokenKey) {
            setDaoBalance(parseInt(data.fungible_tokens[daoTokenKey].balance) / 1_000_000)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch balances:', err)
      }
    }

    fetchBalances()
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [address, apiBase])

  const connectWallet = useCallback(async () => {
    if (!projectId) {
      setConnectionError('WalletConnect Project ID not configured. Add VITE_WALLETCONNECT_PROJECT_ID to your .env file.')
      return
    }

    setIsConnecting(true)
    setWcUri(null)
    setConnectionError(null)

    try {
      const { UniversalProvider } = await import('@walletconnect/universal-provider')
      
      const wcProvider = await UniversalProvider.init({
        projectId,
        metadata: {
          name: 'Clarity DAO System',
          description: 'Decentralized Autonomous Organization on Stacks',
          url: window.location.origin,
          icons: [new URL('/logo.svg', window.location.origin).toString()]
        }
      })

      setProvider(wcProvider)

      wcProvider.on('display_uri', (uri) => {
        console.log('WalletConnect URI:', uri)
        setWcUri(uri)
      })

      // Handle session disconnect
      wcProvider.on('session_delete', () => {
        setAddress(null)
        setSession(null)
        setStxBalance(null)
        setDaoBalance(null)
      })

      const sess = await wcProvider.connect({
        requiredNamespaces: {
          stacks: {
            chains: ['stacks:1'],
            methods: ['stx_getAddresses', 'stx_signTransaction', 'stx_transferStx'],
            events: []
          }
        }
      })

      setSession(sess)

      // Get addresses
      try {
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
        
        const addressRequest = wcProvider.request({
          method: 'stx_getAddresses',
          params: {}
        }, 'stacks:1')

        const result = await Promise.race([addressRequest, timeout])
        
        if (result?.addresses?.length > 0) {
          const stxAddress = result.addresses.find(a => a.symbol === 'STX')?.address 
            || result.addresses[0]?.address
          setAddress(stxAddress)
        }
      } catch (err) {
        console.warn('stx_getAddresses failed, using session account:', err)
        const accounts = sess?.namespaces?.stacks?.accounts
        if (accounts?.[0]) {
          const addr = accounts[0].split(':')[2]
          setAddress(addr)
        }
      }

      setWcUri(null)
    } catch (error) {
      console.error('Connection failed:', error)
      setConnectionError(error.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [projectId])

  const disconnectWallet = useCallback(async () => {
    if (provider && session) {
      try {
        await provider.disconnect()
      } catch (e) {
        console.warn('Disconnect error:', e)
      }
    }
    setAddress(null)
    setSession(null)
    setProvider(null)
    setStxBalance(null)
    setDaoBalance(null)
    setConnectionError(null)
  }, [provider, session])

  const signTransaction = useCallback(async (txHex) => {
    if (!provider) throw new Error('Wallet not connected')
    
    const result = await provider.request({
      method: 'stx_signTransaction',
      params: {
        transaction: txHex,
        broadcast: true
      }
    }, 'stacks:1')

    return result
  }, [provider])

  // Call a read-only contract function
  const callReadOnly = useCallback(async (contractId, functionName, args = []) => {
    const [contractAddress, contractName] = contractId.split('.')
    const url = `${apiBase}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address || contractAddress,
        arguments: args
      })
    })

    if (!response.ok) {
      throw new Error(`Contract call failed: ${response.statusText}`)
    }

    return response.json()
  }, [address, apiBase])

  // Shorten address for display
  const shortenAddress = useCallback((addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  const value = useMemo(() => ({
    address,
    shortAddress: shortenAddress(address),
    isConnecting,
    isConnected: !!address,
    connectionError,
    wcUri,
    stxBalance,
    daoBalance,
    network,
    contracts: CONTRACTS,
    connectWallet,
    disconnectWallet,
    signTransaction,
    callReadOnly,
    setNetwork,
    deployer: DEPLOYER
  }), [
    address, 
    shortenAddress, 
    isConnecting, 
    connectionError, 
    wcUri, 
    stxBalance, 
    daoBalance, 
    network, 
    connectWallet, 
    disconnectWallet, 
    signTransaction, 
    callReadOnly
  ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
