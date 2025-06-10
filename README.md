# Web3 NFT Minting DApp

A bare bones web application for connecting to blockchain wallets and minting NFTs from contract `0xe2bbd2d3f20d5f9abce2933cc5b9e7b7e307b843`.

## Features

✅ **Multi-Wallet Support**: Connect with any wallet including:
- MetaMask
- WalletConnect (supports 300+ wallets)
- Coinbase Wallet
- Rainbow
- Trust Wallet
- And many more...

✅ **Seamless Connection**: One-click wallet connection with Web3Modal
✅ **Simple Minting**: Easy NFT minting interface
✅ **Modern UI**: Clean, responsive design
✅ **Transaction Tracking**: View transactions on Etherscan

## Setup Instructions

### 1. Get a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID

### 2. Update Configuration

Open `src/main.jsx` and replace `'YOUR_PROJECT_ID'` with your actual WalletConnect project ID:

```javascript
const projectId = 'your-actual-project-id-here'
```

### 3. Adjust Contract Settings

In `src/App.jsx`, update these values as needed:
- `CONTRACT_ADDRESS`: Already set to your contract
- `mintPrice`: Adjust the mint price (currently set to 0.01 ETH)
- `MINT_ABI`: Update if your contract has different function signatures

### 4. Run the Application

```bash
npm install
npm run dev
```

## Contract Information

- **Contract Address**: `0xe2bbd2d3f20d5f9abce2933cc5b9e7b7e307b843`
- **Function**: `mint()` (payable)
- **Price**: 0.01 ETH (adjustable in code)

## Technology Stack

- **React** + **Vite** for the frontend
- **Web3Modal** for wallet connections
- **Wagmi** for Web3 interactions
- **Viem** for Ethereum utilities

## Customization

To customize for your specific contract:

1. Update the `MINT_ABI` in `App.jsx` with your contract's ABI
2. Adjust the mint price in the `mintPrice` state
3. Modify the UI text and styling as needed
4. Add any additional contract functions if required

The app is designed to be minimal and easily extensible for your specific needs.
