# Clarity DAO System

A comprehensive decentralized autonomous organization (DAO) governance system built on **Stacks blockchain** with **Clarity 4**. Features membership tokens, proposal creation & voting, treasury management, staking rewards, bounty programs, and NFT memberships.

![Stacks](https://img.shields.io/badge/Stacks-Mainnet-blue)
![Clarity](https://img.shields.io/badge/Clarity-4.0-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- **Token Governance** - SIP-010 compliant DAO tokens with vesting and delegation
- **Proposal Voting** - Quadratic and conviction voting mechanisms
- **Treasury Management** - Streaming payments, milestones, and recurring withdrawals
- **Staking Rewards** - Tiered APY (5-25%) with auto-compound option
- **Bounty System** - Task-based rewards with reputation tracking
- **Membership NFTs** - SIP-009 NFTs with tier-based benefits

## 📦 Deployed Contracts (Mainnet)

| Contract | Address |
|----------|---------|
| DAO Token v5.1 | `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.dao-token-v5-1` |
| Governance v5.1 | `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.governance-v5-1` |
| Treasury v5.1 | `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.treasury-v5-1` |
| Staking v5.1 | `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.staking-v5-1` |
| Bounty v5.1 | `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.bounty-v5-1` |
| Membership NFT v5.1 | `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.membership-nft-v5-1` |

## 🏗️ Project Structure

```
clarity-dao-system/
├── contracts/                 # Clarity smart contracts
│   ├── dao-token-v5.1.clar   # SIP-010 token with vesting
│   ├── governance-v5.1.clar  # Voting and proposals
│   ├── treasury-v5.1.clar    # Fund management
│   ├── staking-v5.1.clar     # Staking rewards
│   ├── bounty-v5.1.clar      # Bounty program
│   └── membership-nft-v5.1.clar # NFT memberships
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── context/          # React contexts
│   │   └── config.js         # Configuration
│   └── package.json
├── tests/                     # Contract tests
├── deployments/               # Deployment plans
└── settings/                  # Network configs
```

## 🚀 Quick Start

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) >= 2.0
- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) or npm

### Smart Contracts

```bash
# Clone the repository
git clone https://github.com/AdekunleBamz/Clarity-Dao-System.git
cd Clarity-Dao-System

# Check contracts compile
clarinet check

# Run tests
clarinet test

# Start local devnet
clarinet devnet start
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your WalletConnect Project ID to .env
# Get one at https://cloud.walletconnect.com

# Start development server
npm run dev
```

## 🔑 Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# Required for wallet connection
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional
VITE_STACKS_NETWORK=mainnet
VITE_DEBUG=false
```

## 📜 Contract Features

### DAO Token (v5.1)
- SIP-010 fungible token standard
- Token vesting schedules
- Token locking for governance
- Snapshot-based voting power
- Approve/TransferFrom pattern

### Governance (v5.1)
- Proposal creation with token threshold
- Delegation of voting power
- Quadratic voting support
- Conviction voting mechanism
- Voter rewards distribution

### Treasury (v5.1)
- STX and token deposits
- Streaming payment schedules
- Milestone-based releases
- Recurring payments
- Multi-sig support

### Staking (v5.1)
- Flexible lock periods (1 month - 2 years)
- Tiered APY rewards (5% - 25%)
- Auto-compound option
- Early unstake penalty (20%)
- Governance participation bonus

### Bounty (v5.1)
- Task creation and management
- Submission and review workflow
- Dispute resolution
- Reputation tracking
- Milestone payments

### Membership NFT (v5.1)
- SIP-009 NFT standard
- 5 membership tiers
- Achievement badges
- Tier-based voting multipliers

## 🧪 Testing

```bash
# Run all tests
clarinet test

# Run specific test file
clarinet test tests/governance_test.clar

# Check contract syntax
clarinet check
```

## 🌐 Frontend Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **WalletConnect** - Wallet integration
- **Stacks.js** - Blockchain interaction

## �️ Frontend Utilities & Hooks (PRs 1-43)

### Data Fetching & State Management (PR 01-05)
- **React Query Integration** - `useSTXBalance`, `useDAOBalance`, `useTransactionHistory`, `useAccountInfo` hooks for efficient data fetching with caching
- **Error Handling** - `ErrorHandler` class with standardized error parsing and `useErrorHandler` hook for user-friendly error messages
- **Form State Management** - `useForm` hook with complete form handling, validation tracking, and field management
- **Input Validation** - Reusable validators for email, Stacks addresses, token amounts, string lengths, and custom patterns
- **API Request Utils** - `APIClient` class with automatic retry logic, timeout handling, and centralized HTTP methods (GET/POST/PUT/DELETE)

### Storage & Performance (PR 06-07)
- **Storage Manager** - LocalStorage wrapper with expiry support and atomic `set`/`get`/`remove`/`clear` operations
- **Performance Utilities** - `debounce()` and `throttle()` functions with `useDebounce` hook for optimized event handlers

### Utilities & Services (PR 08-10)
- **Date Formatting** - `dateUtils.format()` and `dateUtils.timeAgo()` functions for consistent date handling across the app
- **Logger Service** - Centralized `Logger` class with `log()`, `debug()`, `error()`, and `warn()` methods for debugging
- **Notifications** - `useNotifications` hook for toast-like notifications with `success()`, `error()`, `warning()`, and `info()` shortcuts

### Data Management Hooks (PR 11-20)
10 essential hooks in `useDataHooks.js`:
- `usePagination` - Pagination state and navigation
- `useSearch` - Text search with memoized filtering
- `useFilter` - Dynamic filtering for complex datasets
- `useSort` - Ascending/descending sort functionality
- `useAsync` - Async operation state management
- `useWindowSize` - Responsive window size tracking
- `usePrevious` - Track previous values in state
- `useToggle` - Simple boolean toggle hook
- `useCounter` - Increment/decrement counter utility
- `useLocalStorage` - Persistent state with localStorage sync

### Advanced UI & Styling Utilities (PR 21-43)
Theme, animation, and React hook utilities in `allUtilities.js`:
- **Theme Manager** - Centralized color palette, spacing scale, and breakpoint configuration
- **Color Utilities** - `lighten()`, `darken()`, and `setAlpha()` functions for dynamic color manipulation
- **Accessibility** - Screen reader announcements and focus trap utilities for keyboard navigation
- **Animation Utilities** - Pre-configured fade-in, slide-in, and bounce animations
- **String Utilities** - `truncate()`, `capitalize()`, `camelToKebab()`, `kebabToCamel()` text transformations
- **Number Formatting** - `formatCurrency()`, `formatNumber()`, `abbreviate()` for consistent number display
- **Array & Object Utilities** - `unique()`, `chunk()`, `flatten()`, `groupBy()`, `pick()`, `omit()`, `merge()`, `deepClone()`
- **CSS Helper** - `clsx()` utility for dynamic class name composition
- **UI Hooks** (15 advanced):
  - `useMediaQuery` - Responsive CSS media query detection
  - `useClickOutside` - Detect clicks outside elements  
  - `useKeyboardShortcut` - Handle keyboard shortcuts
  - `useIntersectionObserver` - Intersection detection for animations
  - `useFetch` - Simple fetch hook for API calls
  - `useMounted` - Prevent state updates on unmounted components
  - `useStateHistory` - Track state history with undo/redo
  - `useFocusLock` - Lock focus within modal/drawer elements
  - `usePromise` - Promise state management
  - `useDeepMemo` - Deep equality memoization
  - `useAnimationFrame` - RequestAnimationFrame management
  - `useRafState` - State updates via RAF for smooth animations
  - `useRefState` - Combined ref and state hook

All utilities follow React best practices and integrate seamlessly with @stacks/connect and @stacks/transactions for blockchain operations.

## �📱 Pages

| Page | Description |
|------|-------------|
| Dashboard | Overview stats and quick actions |
| Governance | View and vote on proposals |
| Treasury | Deposit and view transactions |
| Tokens | View balance and voting power |
| Staking | Stake tokens for rewards |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [SIP-010 Token Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)
- [SIP-009 NFT Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md)

---

Built with ❤️ on Stacks
