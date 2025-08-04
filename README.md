# Solana Fungible Token Creator Dashboard

A modern, full-stack DApp for creating and managing SPL tokens on Solana. Built with Next.js 14, TypeScript, and the latest Solana web3 libraries.

## Features

- 🚀 **Create SPL Tokens**: Easy-to-use interface for creating fungible tokens on Solana mainnet
- 🎨 **Modern UI/UX**: Sleek dark theme with glassmorphic effects and smooth animations
- 🔐 **Wallet Integration**: Support for Phantom and Solflare wallets
- 📊 **Token Dashboard**: View and manage all your created tokens
- 🗄️ **Token List**: Browse all tokens created on the platform with search, filter, and sort
- 🌐 **IPFS Storage**: Decentralized storage for token metadata using Pinata
- ⚡ **Real-time Updates**: Live data from Solana blockchain via Helius API
- 💾 **Database Integration**: Token data persisted in Supabase for fast queries

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v3 with custom theme
- **UI Components**: Radix UI primitives
- **State Management**: TanStack React Query
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation

### Blockchain
- **Network**: Solana Mainnet-Beta
- **Token Standard**: SPL Token 2022
- **SDK**: Metaplex Umi
- **RPC Provider**: Helius
- **Wallet Adapter**: Solana Wallet Adapter

### Backend Services
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Pinata IPFS
- **API**: Next.js API Routes

### Infrastructure
- **Monorepo**: pnpm workspaces
- **Build System**: Turbo

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Solana wallet (Phantom or Solflare)
- API keys for:
  - [Helius](https://helius.dev) (for Solana RPC)
  - [Supabase](https://supabase.com) (for database)
  - [Pinata](https://pinata.cloud) (for IPFS storage)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-fungible-token-creator-dashboard.git
cd solana-fungible-token-creator-dashboard
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env.local` file in `apps/web`:
```env
# Network Configuration
NEXT_PUBLIC_NETWORK=mainnet-beta

# Helius API Key (for mainnet RPC and DAS API)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Pinata Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL script in `apps/web/supabase/schema.sql`
   - Copy your project URL and anon key to `.env.local`

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
solana-fungible-token-creator-dashboard/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/           # App router pages
│       │   ├── components/    # React components
│       │   ├── lib/          # Utilities and services
│       │   └── styles/       # Global styles
│       └── supabase/         # Database schema
├── programs/                  # Solana programs (future)
├── scripts/                   # Utility scripts
└── packages/                  # Shared packages (future)
```

## Key Features Explained

### Token Creation
- Multi-step form with validation
- Image upload to IPFS via Pinata
- Metadata storage on-chain and in Supabase
- Real-time transaction status updates

### Token List (`/tokens`)
- Browse all tokens created on the platform
- Search by name, symbol, creator, or mint address
- Filter by fee status and ownership
- Sort by creation date or supply
- Infinite scroll pagination
- Real-time updates via Supabase

### Token Details
- View comprehensive token information
- Copy addresses with one click
- Direct links to Solana Explorer
- Token metadata from Helius DAS API

## API Integration

### Helius
The app uses Helius for:
- Fast mainnet RPC endpoints
- Digital Asset Standard (DAS) API for token metadata
- Real-time blockchain data

### Supabase
Database schema includes:
- Token information (name, symbol, supply, etc.)
- Creator addresses
- Fee configurations
- Metadata URIs
- Real-time subscriptions for live updates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with the Metaplex Umi SDK
- UI inspired by Orca Whirlpool Dashboard
- Powered by Helius and Supabase 