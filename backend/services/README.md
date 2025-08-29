# SolChain Backend Services

This directory contains the core business logic services for the SolChain platform. These services act as an abstraction layer between the API routes and the SolChain blockchain layer, providing clean, reusable, and well-documented interfaces for wallets, tokens, energy trading, governance, compliance, and system stats.

## 📁 Directory Structure

```
services/
├── README.md                  # This documentation file
├── blockchainService.js       # Primary blockchain integration service
├── authService.js            # Authentication and authorization (future)
├── iotService.js             # IoT device integration (future)
├── notificationService.js    # User notifications (future)
└── analyticsService.js       # Data analytics and reporting (future)
```

## 🔗 Core Services

### BlockchainService (`blockchainService.js`)

Primary service for all blockchain-related operations in SolChain.

Purpose: High-level interface to SolChain smart contracts for wallet management, token ops, energy trading, governance, compliance, and price oracles.

Key Features:
- 🏦 Wallets: KYC-gated wallet creation, role assignment, deterministic address mapping (Hardhat accounts in dev)
- 🪙 Tokens: Transfer, mint-for-production, balance queries
- ⚡ Marketplace: Create buy/sell offers, fetch active offers, accept trades
- 🗳️ Governance: Proposals, voting, validator registration
- �️ Compliance & Security: Audit logs, compliance reports, RBAC, encryption helpers
- 🔮 Oracle: Current energy price from on-chain oracle
- � System: Network/contract stats, architecture overview

Architecture:
```
Frontend Routes → BlockchainService → SolChainAPI → Smart Contracts
```

## 🚀 Quick Start

### Initialize Blockchain Service

```javascript
const blockchainService = require('./services/blockchainService');

// Auto-initializes on require; optionally wait until ready
while (!blockchainService.isInitialized) {
    await new Promise(r => setTimeout(r, 100));
}
```

### Basic Operations

#### Create User Wallet (with KYC and role)
```javascript
const wallet = await blockchainService.createUserWallet('user123', {
    kycData: {
        verified: true,
        authority: 'BREB',
        document: 'NID'
    },
    role: 'prosumer',
    privacySettings: { encryptMetadata: true, zeroKnowledge: false }
});
if (wallet.success) {
    console.log('Address:', wallet.data.address);
    console.log('Role:', wallet.data.role);
    console.log('Governance tokens:', wallet.data.governanceTokens);
}
```

#### Transfer Tokens
```javascript
const transfer = await blockchainService.transferTokens(
    'user123',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '50'
);
if (transfer.success) {
    console.log('Transaction Hash:', transfer.data.transactionHash);
}
```

#### Create Energy Sell Offer
```javascript
const offer = await blockchainService.createSellOffer('user123', {
    energyAmount: '100',
    pricePerKwh: '0.08',
    duration: 24,
    location: 'Solar-Farm-A',
    energySource: 'Solar'
});
```

#### Create Energy Buy Offer
```javascript
const bid = await blockchainService.createBuyOffer('buyer456', {
    energyAmount: '50',
    pricePerKwh: '0.10',
    duration: 24,
    location: 'Grid-Zone-A',
    energySource: 'Any'
});
```

#### Accept Offer (execute trade)
```javascript
const execTx = await blockchainService.acceptOffer('buyer456', 'offerId123', '25');
```

#### Get Marketplace Data
```javascript
const offers = await blockchainService.getActiveOffers(0, 10);
const stats = await blockchainService.getSystemStats();
const price = await blockchainService.getCurrentEnergyPrice();
```

### Route ↔ Service mapping

- `routes/WalletRoutes.js`
    - GET `/wallet` → `getUserWallet`
    - POST `/wallet/create` → `createUserWallet`
    - POST `/wallet/transfer` → `transferTokens`
- `routes/EnergyRoutes.js`
    - GET `/energy` → `getCurrentEnergyPrice` (+ mock sensors)
    - POST `/energy/production` → `mintTokensForProduction`
    - POST `/energy/sell` → `createSellOffer`
    - GET `/energy/stats` → `getSystemStats`
- `routes/buyRoutes.js`
    - GET `/buy` → `getActiveOffers`
    - POST `/buy/offer` → `createBuyOffer` or `acceptOffer` (two handlers exist)

## 📊 API Reference

### BlockchainService Methods

Core:
- `createUserWallet(userId, options)` → Promise<WalletCreateResult>
- `getUserWallet(userId)` → Promise<WalletDataResult>
- `getUserAddress(userId)` → string
- `transferTokens(fromUserId, toAddress, amount)` → Promise<TransactionResult>

Marketplace:
- `createSellOffer(userId, offerData)` → Promise<OfferTxResult>
- `createBuyOffer(userId, offerData)` → Promise<OfferTxResult>
- `getActiveOffers(offset, limit)` → Promise<{ success, data: OfferView[] }>
- `acceptOffer(userId, offerId, energyAmount)` → Promise<TransactionResult>

Tokens & Oracle:
- `mintTokensForProduction(userId, amount)` → Promise<TransactionResult>
- `getCurrentEnergyPrice()` → Promise<{ success, data: { price, timestamp, confidence } }>

System:
- `getSystemStats()` → Promise<{ success, data: SystemOverview }>
- `getArchitectureOverview()` → ArchitectureOverview

Governance & Validators:
- `createGovernanceProposal(userId, proposalData)` → Promise<{ success, data: { proposalId, deadline, status } }>
- `voteOnProposal(userId, proposalId, vote)` → Promise<{ success, data: { proposalId, vote, currentVotes } }>
- `getActiveProposals()` → Promise<{ success, data: ProposalView[] }>
- `registerValidator(userId, { stakeAmount, nodeAddress, hardware })` → Promise<{ success, data: { validatorId, stakeAmount, status } }>

Compliance:
- `getComplianceReport(requestorId, { startDate, endDate, reportType })` → Promise<{ success, data: ComplianceReport }>

### Data Types

#### WalletCreateResult (from `createUserWallet`)
```typescript
interface WalletCreateResult {
    success: boolean;
    data?: {
        address: string;
        balance: string;           // initial ST balance as string
        walletIndex: number;       // mapped Hardhat account index (dev)
        role: 'prosumer' | 'consumer' | 'validator' | 'regulator' | 'admin';
        kycVerified: boolean;
        kycAuthority: string;
        governanceTokens: string;  // allocated governance tokens
        privacy: { encryptMetadata: boolean; zeroKnowledge?: boolean };
        permissions: string[];     // RBAC-permitted operations
    };
    error?: string;
}
```

#### WalletDataResult (from `getUserWallet`)
```typescript
interface WalletDataResult {
    success: boolean;
    data?: {
        address: string;
        balance: {
            solarToken: string;   // e.g., "150 ST"
            energyCredits: string;// mock/demo value
            eth: string;          // native balance
        };
        transactions: Array<{
            id: string;
            type: 'sell' | 'buy' | 'transfer';
            description: string;
            amount: string;      // e.g., "+5.0 kWh"
            value: string;       // e.g., "+40.0 ST"
            timestamp: string;   // relative e.g., "15m ago"
            txHash: string;
        }>
    };
    error?: string;
}
```

#### OfferData
```typescript
interface OfferData {
    energyAmount: string;     // Amount in kWh
    pricePerKwh: string;      // Price in ST tokens
    duration?: number;        // Duration in hours (default: 24)
    location?: string;        // Grid location (default: "Grid-Zone-A")
    energySource?: string;    // Energy source (default: "Solar")
}
```

#### OfferTxResult
```typescript
interface OfferTxResult {
    success: boolean;
    data?: {
        transactionHash: string;
        blockNumber: string;
        gasUsed?: string;
        offerId?: string;     // when available from contract
    };
    error?: string;
}
```

#### TransactionResult
```typescript
interface TransactionResult {
    success: boolean;
    data?: {
        transactionHash: string;
        blockNumber: string;
        gasUsed?: string;
        to?: string;
        amount?: string;
    };
    error?: string;
}
```

#### Governance
```typescript
type VoteChoice = 'for' | 'against' | 'abstain';

interface ProposalView {
    id: string;
    title: string;
    description: string;
    category: 'parameter' | 'upgrade' | 'policy' | string;
    deadline: string;
    votes: { for: number; against: number; abstain: number };
    voterCount: number;
}

interface ComplianceReport {
    reportId: string;
    requestor: string;
    dateRange: { startDate: string; endDate: string };
    reportType: 'full' | 'transactions' | 'users' | string;
    generatedAt: string;
    metrics: {
        totalTransactions: number;
        kycVerifications: number;
        securityEvents: number;
        governanceActivities: number;
        validatorCount: number;
        activeUsers: number;
    };
    events: Array<any>;
    compliance: {
        kycCompliance: string;
        dataPrivacy: string;
        auditTrail: string;
        governance: string;
    };
}
```

## 🔧 Configuration

### Environment Variables

The blockchain service auto-initializes using the local Hardhat network via `SolChainConfig`. For advanced setups, these env vars may be used:

```bash
# Blockchain Configuration
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Contract Addresses (auto-populated during deployment)
SOLAR_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ENERGY_TRADING_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
ORACLE_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

# Gas Configuration
DEFAULT_GAS_LIMIT=3000000
DEFAULT_GAS_PRICE=20000000000
```

### Initialization Dependencies

1. Blockchain Node: Hardhat local node running
2. Smart Contracts: SolChain contracts deployed (auto-handled in dev by SolChain API config)
3. Configuration: Contract addresses available (or auto-populated)

## 🧪 Testing

### Integration Tests

Run the comprehensive integration test suite:

```bash
cd backend
npm test
```

This executes `test-blockchain-integration.js` which tests:
- ✅ Service initialization
- ✅ Wallet creation and management
- ✅ Token operations (mint, transfer, balance)
- ✅ Energy marketplace (create/retrieve offers)
- ✅ System statistics and oracle data

### Manual Testing

```javascript
// Test wallet creation
const wallet = await blockchainService.createUserWallet('test123');
console.log('Wallet created:', wallet);

// Test token minting
const mint = await blockchainService.mintTokensForProduction('test123', '100');
console.log('Tokens minted:', mint);

// Test offer creation
const offer = await blockchainService.createSellOffer('test123', {
    energyAmount: '50',
    pricePerKwh: '0.08'
});
console.log('Offer created:', offer);
```

## 🔒 Security Considerations

### Private Key Management
- 🚨 Development: Uses Hardhat accounts for testing (deterministic userId→address mapping)
- 🏭 Production: Secure key management (HSM/AWS KMS); never store raw keys in code
- 🔐 Access Control: Limit minting/approval to authorized roles (MINTER, etc.)

### Smart Contract Security
- ✅ **Role-based Access**: MINTER_ROLE, PAUSER_ROLE controls
- ✅ **Reentrancy Protection**: NonReentrant modifiers
- ✅ **Input Validation**: Comprehensive parameter checking

### API Security
- 🛡️ Input validation on all endpoints (amounts, addresses, IDs)
- 📊 Rate limiting to prevent transaction spam
- 🔍 Audit logging: all key events are logged with SHA-256 hashes

## 🚀 Deployment

### Local Development
```bash
# Start blockchain node
npm run blockchain:start

# Deploy contracts
npm run blockchain:deploy

# Start backend
npm run dev
```

### Production Deployment
1. **Configure Network**: Update RPC_URL for mainnet/testnet
2. **Deploy Contracts**: Run deployment scripts on target network
3. **Update Addresses**: Set contract addresses in environment
4. **Start Services**: Launch backend with production configuration

## 📈 Performance Optimization

### Caching Strategies
- **User Address Mapping**: Cache userId → address relationships
- **Contract ABIs**: Load once during initialization
- **Transaction Nonces**: Track to prevent conflicts

### Gas Optimization
- **Batch Operations**: Group multiple transactions
- **Gas Price Monitoring**: Adjust based on network conditions
- **Transaction Queuing**: Manage transaction ordering

## 🔮 Future Enhancements

### Planned Services

#### AuthService
- JWT token management
- Role-based permissions
- Session handling

#### IoTService
- Device registration and management
- Real-time energy data ingestion
- Device verification and certification

#### NotificationService
- Real-time transaction notifications
- Email/SMS alerts
- Push notifications for mobile app

#### AnalyticsService
- Energy trading analytics
- User behavior insights
- Platform performance metrics

### Roadmap Features
- 🌐 Multi-chain support (Ethereum/Polygon/BSC)
- 🔄 Cross-chain bridges
- 📱 Mobile SDK (React Native)
- 🤖 AI-powered pricing (integration with `ai-ml/` services)

## 🤝 Contributing

### Development Guidelines
1. **Documentation**: All methods must have JSDoc comments
2. **Error Handling**: Use consistent error response format
3. **Testing**: Add tests for new functionality
4. **Logging**: Include comprehensive logging for debugging

### Code Style
- Use async/await for asynchronous operations
- Return standardized `{success, data, error}` objects
- Include transaction hashes in successful responses
- Log important operations for monitoring

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit pull request with detailed description

## 📞 Support

For questions or issues with the backend services:

- 📧 Email: dev@solchain.com
- 💬 Discord: SolChain Development Server
- 🐛 Issues: https://github.com/gagradebnath/SolChain/issues

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](../../LICENSE) file for details.

---

**Built with ❤️ by the SolChain Team**

*Revolutionizing energy trading through blockchain technology*
