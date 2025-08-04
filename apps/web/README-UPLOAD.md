# Image Upload Feature

This app supports direct image uploads for token logos using Pinata IPFS.

## Current Implementation

The app uses **Pinata's IPFS service** with a demo API key for uploading images and metadata.

## How it works

1. **Select an image**: Use the file input to select your token's logo (max 5MB)
2. **Upload to IPFS**: The image is uploaded to IPFS via Pinata
3. **Metadata creation**: Token metadata JSON is created with the IPFS image URL
4. **Metadata upload**: The metadata is also uploaded to IPFS
5. **On-chain storage**: The metadata IPFS URI is stored on-chain with your token

## Supported formats
- JPEG/JPG
- PNG
- WebP
- GIF

## Production Setup

The app includes a demo Pinata API key with rate limits. For production:

### Get Your Own Pinata API Key:
1. Sign up at https://pinata.cloud (free tier available)
2. Go to API Keys section
3. Create a new API key
4. Update your `.env.local`:
```
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token_here
```

### Alternative: NFT.Storage Note
The new NFT.Storage API (with keys like `4c332f52.eae10e4998c04a64b5f630a0d28d36c9`) is for **preserving existing NFTs**, not uploading new files. For new uploads, you need:
- Classic NFT.Storage (https://nft.storage) with JWT tokens
- Or use Pinata/Infura/other IPFS services

## Benefits

- **Decentralized**: Images stored on IPFS
- **Permanent**: Content-addressed storage
- **Fast**: Direct HTTP uploads
- **Reliable**: Pinata provides good uptime

## Fallback

If uploads fail, the app falls back to data URIs to ensure your token creation succeeds. 