#!/bin/bash

# Mainnet Deployment Script for Token Factory
# Program ID: xCtaFUv4D3NRP5NGvaf3uSSKgD1cbbi9mUaJgNJNYc1

echo "🚀 Token Factory Mainnet Deployment Script"
echo "========================================="
echo ""

# Check current Solana configuration
echo "📍 Current Solana Configuration:"
solana config get
echo ""

# Confirm mainnet deployment
read -p "⚠️  Are you deploying to MAINNET? This will cost SOL and is irreversible. Type 'yes' to continue: " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Check balance
echo ""
echo "💰 Checking SOL balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"
echo "Required: ~2-3 SOL for deployment"
echo ""

# Verify program ID
echo "🔑 Verifying program ID..."
PROGRAM_ID=$(solana-keygen pubkey target/deploy/token_factory-keypair.json)
echo "Program ID: $PROGRAM_ID"

if [ "$PROGRAM_ID" != "xCtaFUv4D3NRP5NGvaf3uSSKgD1cbbi9mUaJgNJNYc1" ]; then
    echo "❌ Program ID mismatch! Expected: xCtaFUv4D3NRP5NGvaf3uSSKgD1cbbi9mUaJgNJNYc1"
    exit 1
fi

echo "✅ Program ID verified"
echo ""

# Build program
echo "🔨 Building program..."
anchor build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Deploy to mainnet
echo "🚀 Deploying to mainnet..."
echo "This may take a few minutes..."

anchor deploy --provider.cluster mainnet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Initialize platform configuration with your treasury wallet"
    echo "2. Update frontend configuration with:"
    echo "   - Program ID: $PROGRAM_ID"
    echo "   - Network: mainnet-beta"
    echo "   - Treasury wallet: YOUR_TREASURY_WALLET"
    echo "3. Consider making the program immutable:"
    echo "   solana program set-upgrade-authority $PROGRAM_ID --final"
    echo ""
    echo "🔗 View on Explorer:"
    echo "https://explorer.solana.com/address/$PROGRAM_ID"
else
    echo "❌ Deployment failed!"
    exit 1
fi 