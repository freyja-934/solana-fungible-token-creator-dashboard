import { config } from '@/lib/config';
import { TokenFormData } from '@/lib/schemas';
import { Umi } from '@metaplex-foundation/umi';
import { PublicKey } from '@solana/web3.js';

// Program IDs for different networks
const PROGRAM_IDS = {
  'mainnet-beta': 'xCtaFUv4D3NRP5NGvaf3uSSKgD1cbbi9mUaJgNJNYc1', // Your mainnet program ID
  'devnet': '7RSKqnZYg6wsPyHAjKK1i7RCYrYoyoSDw2AaPxMnAnWT', // Your devnet program ID
  'testnet': 'xCtaFUv4D3NRP5NGvaf3uSSKgD1cbbi9mUaJgNJNYc1', // Not deployed on testnet yet
} as const;

// Get the program ID based on the current network
export const TOKEN_FACTORY_PROGRAM_ID = new PublicKey(
  PROGRAM_IDS[config.network] || PROGRAM_IDS['mainnet-beta']
);

// Platform treasury wallet (should be configured based on your deployment)
// This should match the treasury used in platform initialization
export const PLATFORM_TREASURY = new PublicKey('ApKzdnJu1hWjxmSN7jbsPkCKp9yRgijZVGbjNWEh25yc'); // Platform treasury from on-chain config

// Platform fee configuration
export const PLATFORM_FEES = {
  creationFee: 0.1, // 0.1 SOL
  transferFeeBps: 10, // 0.1% (10 basis points)
};

export interface CreateCustomTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  treasury: PublicKey;
  staking: PublicKey;
  marketing: PublicKey;
  treasuryBps: number;
  stakingBps: number;
  marketingBps: number;
}

export interface CreateCustomTokenResult {
  mint: PublicKey;
  transactionSignature: string;
}

// Helper function to get PDA addresses
export function getTokenConfigPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('token_config'), mint.toBuffer()],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

export function getFeeConfigPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('fee_config'), mint.toBuffer()],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

export function getFeeExemptListPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('fee_exempt_list'), mint.toBuffer()],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

export function getPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

export async function createCustomTokenWithUmi(
  umi: Umi,
  formData: TokenFormData,
  metadataUri?: string
): Promise<CreateCustomTokenResult> {
  const { generateSigner, some, none } = await import('@metaplex-foundation/umi');
  const { toWeb3JsPublicKey, fromWeb3JsInstruction } = await import('@metaplex-foundation/umi-web3js-adapters');
  const { SystemProgram, PublicKey: Web3JsPublicKey, TransactionInstruction, SYSVAR_RENT_PUBKEY } = await import('@solana/web3.js');
  const { TOKEN_2022_PROGRAM_ID } = await import('@solana/spl-token');
  
  // Generate mint keypair using UMI
  const mintKeypair = generateSigner(umi);
  const mint = toWeb3JsPublicKey(mintKeypair.publicKey);
  
  // Get PDAs
  const [tokenConfig] = getTokenConfigPDA(mint);
  const [feeConfig] = getFeeConfigPDA(mint);
  const [feeExemptList] = getFeeExemptListPDA(mint);
  const [platformConfig] = getPlatformConfigPDA();
  
  // Get fee recipients (use provided wallets or default to authority)
  const authority = toWeb3JsPublicKey(umi.identity.publicKey);
  const treasury = formData.treasuryWallet ? new Web3JsPublicKey(formData.treasuryWallet) : authority;
  const staking = formData.stakingWallet ? new Web3JsPublicKey(formData.stakingWallet) : authority;
  const marketing = formData.marketingWallet ? new Web3JsPublicKey(formData.marketingWallet) : authority;
  
  // Calculate initial supply with decimals
  const initialSupply = formData.initialSupply 
    ? BigInt(parseFloat(formData.initialSupply) * Math.pow(10, formData.decimals))
    : BigInt(0);
  
  try {
    // Manually build the instruction without Anchor's high-level API
    // Pre-calculated discriminator for "global:initialize_token"
    // This is the first 8 bytes of sha256("global:initialize_token")
    const discriminator = Buffer.from([38, 209, 150, 50, 190, 117, 16, 54]);
    
    // Encode the instruction data using Borsh-style encoding
    const nameBytes = Buffer.from(formData.name);
    const symbolBytes = Buffer.from(formData.symbol);
    
    // Helper function to encode u32 (little-endian)
    const encodeU32 = (value: number) => {
      const buf = Buffer.allocUnsafe(4);
      buf.writeUInt32LE(value, 0);
      return buf;
    };
    
    // Helper function to encode u64 (little-endian)
    const encodeU64 = (value: bigint) => {
      const buf = Buffer.allocUnsafe(8);
      buf.writeBigUInt64LE(value, 0);
      return buf;
    };
    
    // Helper function to encode u16 (little-endian)
    const encodeU16 = (value: number) => {
      const buf = Buffer.allocUnsafe(2);
      buf.writeUInt16LE(value, 0);
      return buf;
    };
    
    // Build the instruction data
    const instructionData = Buffer.concat([
      discriminator,
      // params struct encoding:
      // name (string: length + data)
      encodeU32(nameBytes.length),
      nameBytes,
      // symbol (string: length + data)
      encodeU32(symbolBytes.length),
      symbolBytes,
      // decimals (u8)
      Buffer.from([formData.decimals]),
      // initialSupply (u64)
      encodeU64(initialSupply),
      // treasury (pubkey - 32 bytes)
      treasury.toBuffer(),
      // staking (pubkey - 32 bytes)
      staking.toBuffer(),
      // marketing (pubkey - 32 bytes)
      marketing.toBuffer(),
      // treasuryBps (u16)
      encodeU16(formData.treasuryBps || 0),
      // stakingBps (u16)
      encodeU16(formData.stakingBps || 0),
      // marketingBps (u16)
      encodeU16(formData.marketingBps || 0),
    ]);
    
    // Create the instruction
    const initializeTokenIx = new TransactionInstruction({
      programId: TOKEN_FACTORY_PROGRAM_ID,
      keys: [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: mint, isSigner: true, isWritable: true },
        { pubkey: tokenConfig, isSigner: false, isWritable: true },
        { pubkey: feeConfig, isSigner: false, isWritable: true },
        { pubkey: feeExemptList, isSigner: false, isWritable: true },
        { pubkey: platformConfig, isSigner: false, isWritable: true },
        { pubkey: PLATFORM_TREASURY, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
      ],
      data: instructionData,
    });
    
    // Convert instruction to UMI format
    const umiInstruction = fromWeb3JsInstruction(initializeTokenIx);
    
    // Build the transaction using UMI's transaction builder
    const { transactionBuilder: txBuilder } = await import('@metaplex-foundation/umi');
    let builder = txBuilder([{ 
      instruction: umiInstruction, 
      signers: [mintKeypair],
      bytesCreatedOnChain: 0 // We'll calculate this if needed
    }]);
    
    // Send and confirm the token creation transaction first
    const result = await builder.sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' },
    });
    
    const signature = result.signature;
    
    console.log('Token created with custom program!');
    console.log('Mint:', mint.toBase58());
    console.log('Transaction:', signature);
    
    // Convert signature to base58 string
    const { base58 } = await import('@metaplex-foundation/umi/serializers');
    let signatureString = base58.deserialize(signature)[0];
    
    // If metadata URI is provided, add metadata in a separate transaction
    if (metadataUri) {
      console.log('Adding metadata to token...');
      
      try {
        const { createMetadataAccountV3 } = await import('@metaplex-foundation/mpl-token-metadata');
        
        // Create metadata for the existing mint
        const createMetadataResult = await createMetadataAccountV3(umi, {
          mint: mintKeypair.publicKey,
          mintAuthority: umi.identity,
          payer: umi.identity,
          updateAuthority: umi.identity.publicKey,
          data: {
            name: formData.name,
            symbol: formData.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0, // 0%
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: formData.mintAuthority !== 'none',
          collectionDetails: null,
        }).sendAndConfirm(umi);
        
        console.log('Metadata added successfully!');
        // Return the metadata transaction signature as it's the final one
        signatureString = base58.deserialize(createMetadataResult.signature)[0];
      } catch (metadataError) {
        console.error('Failed to add metadata:', metadataError);
        // Token was created successfully even if metadata failed
        console.log('Token created but metadata addition failed. You can add metadata later.');
      }
    }
    
    return {
      mint: mint,
      transactionSignature: signatureString,
    };
  } catch (error) {
    console.error('Error creating token with custom program:', error);
    
    // Log more details about the error
    if (error && typeof error === 'object' && 'getLogs' in error && typeof error.getLogs === 'function') {
      try {
        const logs = await error.getLogs();
        console.error('Full transaction logs:', logs);
      } catch (logError) {
        console.error('Could not get logs:', logError);
      }
    }
    
    // Log the accounts being used
    console.error('Debug info:');
    console.error('Program ID:', TOKEN_FACTORY_PROGRAM_ID.toBase58());
    console.error('Mint:', mint.toBase58());
    console.error('Authority:', authority.toBase58());
    console.error('Token Config PDA:', tokenConfig.toBase58());
    console.error('Fee Config PDA:', feeConfig.toBase58());
    console.error('Platform Config PDA:', platformConfig.toBase58());
    
    throw error;
  }
}

 