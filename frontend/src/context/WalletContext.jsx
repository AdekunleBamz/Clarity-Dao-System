import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const WalletContext = createContext(null)

const DEPLOYER = 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N'

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [session, setSession] = useState(null)
  const [provider, setProvider] = useState(null)
  const [wcUri, setWcUri] = useState(null)

  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

  const connectWallet = useCallback(async () => {
    if (!projectId) {
      console.error('WalletConnect Project ID not configured')
      return
    }

    setIsConnecting(true)
    setWcUri(null)

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

  const value = {
    address,
    isConnecting,
    isConnected: !!address,
    wcUri,
    connectWallet,
    disconnectWallet,
    signTransaction,
    deployer: DEPLOYER
  }

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
