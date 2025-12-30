# Clarity DAO System

A decentralized autonomous organization (DAO) governance system built on Stacks with **Clarity 4**. Features membership tokens, proposal creation & voting, and treasury management with **0.01 STX creator fees**.

## 🏗️ Architecture

This project consists of 3 smart contracts:

### 1. `dao-token.clar` - Membership Token
- **SIP-010** compliant fungible token
- Token name: "DAO Governance Token" (DAOG)
- Initial supply: 1,000,000 tokens
- Minting/burning capabilities
- Authorized minter system

### 2. `governance.clar` - Proposal & Voting
- Create proposals (requires 1000+ tokens)
- Vote on proposals with token-weighted voting
- 144 block voting period (~1 day)
- 10% quorum requirement
- 51% approval threshold
- Proposal finalization and execution

### 3. `treasury.clar` - Fund Management
- STX deposit/withdrawal system
- **0.01 STX (10,000 micro-STX) creator fee** on transactions
- Governance-approved withdrawals
- Emergency withdrawal (owner only)
- Pause functionality

## 📁 Project Structure

```
clarity-dao-system/
├── Clarinet.toml              # Project configuration
├── README.md                  # This file
├── contracts/
│   ├── dao-token.clar         # SIP-010 membership token
│   ├── governance.clar        # Proposal & voting system
│   └── treasury.clar          # Fund management
├── settings/
│   └── Devnet.toml            # Development network config
└── tests/
    ├── dao-token_test.clar    # Token tests
    ├── governance_test.clar   # Governance tests
    └── treasury_test.clar     # Treasury tests
```

## 🚀 Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) installed
- Node.js (for additional tooling)

### Installation

```bash
# Clone the repository
git clone https://github.com/adekunlebmz/clarity-dao-system.git
cd clarity-dao-system

# Check contracts
clarinet check

# Run tests
clarinet test

# Start console for interactive testing
clarinet console
```

## 💰 Creator Fee

Every deposit and withdrawal includes a **0.01 STX** creator fee that is automatically sent to the creator address. This provides sustainable funding for ongoing development and maintenance.

| Action | Creator Fee |
|--------|-------------|
| Deposit | 0.01 STX |
| Withdrawal | 0.01 STX |

## 📋 Contract Functions

### DAO Token

| Function | Description |
|----------|-------------|
| `transfer` | Transfer tokens between accounts |
| `mint` | Mint new tokens (authorized only) |
| `burn` | Burn tokens |
| `add-minter` | Add authorized minter |
| `get-balance` | Get token balance |

### Governance

| Function | Description |
|----------|-------------|
| `create-proposal` | Create a new proposal |
| `vote` | Cast vote on proposal |
| `finalize-proposal` | Finalize after voting ends |
| `execute-proposal` | Execute passed proposal |
| `get-proposal` | Get proposal details |

### Treasury

| Function | Description |
|----------|-------------|
| `deposit` | Deposit STX (with fee) |
| `deposit-no-fee` | Deposit without fee |
| `claim-withdrawal` | Claim approved withdrawal |
| `get-treasury-balance` | Get current balance |
| `get-treasury-stats` | Get full statistics |

## 🧪 Testing

Run the test suite:

```bash
# Check all contracts compile
clarinet check

# Run all tests
clarinet test

# Run specific test file
clarinet test tests/dao-token_test.clar
```

## 🌐 Deployment

### Testnet

```bash
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/default.testnet.yaml
```

### Mainnet

```bash
clarinet deployments generate --mainnet
clarinet deployments apply -p deployments/default.mainnet.yaml
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ on Stacks
