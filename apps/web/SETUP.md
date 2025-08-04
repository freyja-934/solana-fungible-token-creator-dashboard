# 🚀 Setup Guide

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```env
# Solana Configuration
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet
```

### Optional Environment Variables

For metadata uploads (CLI script):

```env
# Private key for metadata uploads (base58 format)
SOLANA_PRIVATE_KEY=your-base58-private-key-here
```

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Wallet Setup

1. Install [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/) wallet
2. Switch to Solana Devnet
3. Get some devnet SOL from a [faucet](https://faucet.solana.com/)
4. Connect your wallet to the app

## Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
pnpm install  # Reinstall dependencies
```

**Wallet connection issues:**
- Make sure you're on Solana Devnet
- Refresh the page and try reconnecting
- Check browser console for errors

**Transaction failures:**
- Ensure you have enough SOL for transaction fees
- Check that your wallet is connected and unlocked
- Verify you're on the correct network (devnet)

### Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your environment variables
3. Ensure all dependencies are installed
4. Try refreshing the page 