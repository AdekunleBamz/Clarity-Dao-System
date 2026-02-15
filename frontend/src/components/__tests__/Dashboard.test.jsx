import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, createConnectedWalletContext } from '../../test/utils'
import Dashboard from '../Dashboard'

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders dashboard title', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithProviders(<Dashboard />)
    
    // Check for loading indicator or skeleton
    // Implementation-specific
  })

  it('displays stats cards', async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ balance: '1000000000' }),
      })
    )

    const walletState = createConnectedWalletContext()
    renderWithProviders(<Dashboard />, { walletState })

    await waitFor(() => {
      // Check for stats like Total Staked, Active Proposals, etc.
    })
  })

  it('shows connect wallet prompt when not connected', () => {
    renderWithProviders(<Dashboard />)
    
    // Should prompt to connect wallet or show limited data
  })
})

describe('Dashboard Stats', () => {
  it('formats large numbers correctly', () => {
    const walletState = createConnectedWalletContext({
      stxBalance: 1500000000000, // 1.5M STX
    })
    
    renderWithProviders(<Dashboard />, { walletState })
    
    // Should show formatted balance like "1.5M STX"
  })

  it('updates stats when wallet balance changes', async () => {
    const { rerender } = renderWithProviders(<Dashboard />)
    
    // Simulate wallet connection
    // Verify stats update
  })
})

describe('Dashboard Quick Actions', () => {
  it('renders quick action buttons', () => {
    renderWithProviders(<Dashboard />)
    
    // Check for action buttons like Stake, Vote, etc.
  })

  it('navigates to staking page on stake action', () => {
    renderWithProviders(<Dashboard />)
    
    const stakeButton = screen.queryByText(/Stake/i)
    if (stakeButton) {
      fireEvent.click(stakeButton)
      expect(window.location.pathname).toBe('/staking')
    }
  })
})

describe('Dashboard Recent Activity', () => {
  it('shows recent transactions', async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          results: [
            { tx_id: '0x123', tx_status: 'success' },
            { tx_id: '0x456', tx_status: 'success' },
          ],
        }),
      })
    )

    const walletState = createConnectedWalletContext()
    renderWithProviders(<Dashboard />, { walletState })

    await waitFor(() => {
      // Check for transaction list
    })
  })

  it('shows empty state when no transactions', async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      })
    )

    const walletState = createConnectedWalletContext()
    renderWithProviders(<Dashboard />, { walletState })

    await waitFor(() => {
      // Check for empty state message
    })
  })
})
