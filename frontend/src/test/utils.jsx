import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { WalletProvider } from '../context/WalletContext'
import { ThemeProvider } from '../context/ThemeContext'
import { ToastProvider } from '../context/ToastContext'

/**
 * Custom render function that wraps components with all providers
 */
export function renderWithProviders(ui, options = {}) {
  const {
    initialRoute = '/',
    walletState = {},
    ...renderOptions
  } = options

  window.history.pushState({}, 'Test page', initialRoute)

  function AllProviders({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <WalletProvider initialState={walletState}>
              {children}
            </WalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  }
}

/**
 * Create a mock wallet context value
 */
export function createMockWalletContext(overrides = {}) {
  return {
    isConnected: false,
    address: null,
    stxBalance: 0,
    isConnecting: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTransaction: vi.fn(),
    ...overrides,
  }
}

/**
 * Create a mock connected wallet context
 */
export function createConnectedWalletContext(overrides = {}) {
  return createMockWalletContext({
    isConnected: true,
    address: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    stxBalance: 1000000000, // 1000 STX in microSTX
    ...overrides,
  })
}

/**
 * Wait for async updates
 */
export async function waitForAsync(ms = 0) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock API response helper
 */
export function mockFetchResponse(data, options = {}) {
  const { ok = true, status = 200 } = options
  
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  })
}

/**
 * Mock API error response
 */
export function mockFetchError(message, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
    headers: new Headers(),
  })
}

/**
 * Create mock proposal data
 */
export function createMockProposal(overrides = {}) {
  return {
    id: 1,
    title: 'Test Proposal',
    description: 'A test proposal for governance',
    proposer: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    startBlock: 100,
    endBlock: 200,
    votesFor: 1000,
    votesAgainst: 500,
    status: 'active',
    ...overrides,
  }
}

/**
 * Create mock bounty data
 */
export function createMockBounty(overrides = {}) {
  return {
    id: 1,
    title: 'Test Bounty',
    description: 'A test bounty for development',
    creator: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    reward: 100000000, // 100 STX
    status: 'open',
    deadline: Date.now() + 86400000 * 7, // 7 days from now
    ...overrides,
  }
}

/**
 * Create mock staking position
 */
export function createMockStakingPosition(overrides = {}) {
  return {
    amount: 500000000, // 500 STX
    startBlock: 100,
    duration: 1000,
    tier: 2,
    rewards: 25000000, // 25 STX
    autoCompound: true,
    ...overrides,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
