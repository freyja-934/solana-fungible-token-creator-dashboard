import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const DEVNET_URL = 'https://api.devnet.solana.com';
const TOKEN_FACTORY_PROGRAM_ID = new PublicKey('7RSKqnZYg6wsPyHAjKK1i7RCYrYoyoSDw2AaPxMnAnWT');
const PLATFORM_TREASURY = new PublicKey('ApKzdnJu1hWjxmSN7jbsPkCKp9yRgijZVGbjNWEh25yc');

// Helper function to get PDA addresses
function getTokenConfigPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('token_config'), mint.toBuffer()],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

function getFeeConfigPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('fee_config'), mint.toBuffer()],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

function getFeeExemptListPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('fee_exempt_list'), mint.toBuffer()],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

function getPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    TOKEN_FACTORY_PROGRAM_ID
  );
}

// Helper functions for encoding
function encodeU32(value: number): Buffer {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32LE(value, 0);
  return buf;
}

function encodeU64(value: bigint): Buffer {
  const buf = Buffer.allocUnsafe(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
}

function encodeU16(value: number): Buffer {
  const buf = Buffer.allocUnsafe(2);
  buf.writeUInt16LE(value, 0);
  return buf;
}

async function createToken(connection: Connection, payer: Keypair) {
  console.log('🚀 Starting token creation test...\n');
  
  // Generate a new mint keypair
  const mintKeypair = Keypair.generate();
  console.log('📍 Mint address:', mintKeypair.publicKey.toBase58());
  
  // Get PDAs
  const [tokenConfig] = getTokenConfigPDA(mintKeypair.publicKey);
  const [feeConfig] = getFeeConfigPDA(mintKeypair.publicKey);
  const [feeExemptList] = getFeeExemptListPDA(mintKeypair.publicKey);
  const [platformConfig] = getPlatformConfigPDA();
  
  console.log('📍 Token Config PDA:', tokenConfig.toBase58());
  console.log('📍 Fee Config PDA:', feeConfig.toBase58());
  console.log('📍 Fee Exempt List PDA:', feeExemptList.toBase58());
  console.log('📍 Platform Config PDA:', platformConfig.toBase58());
  
  // Token parameters
  const tokenData = {
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 9,
    initialSupply: BigInt(1000000) * BigInt(10 ** 9), // 1M tokens
    treasury: payer.publicKey,
    staking: payer.publicKey,
    marketing: payer.publicKey,
    treasuryBps: 250,  // 2.5%
    stakingBps: 150,   // 1.5%
    marketingBps: 100, // 1%
  };
  
  console.log('\n📝 Token Parameters:');
  console.log(`  Name: ${tokenData.name}`);
  console.log(`  Symbol: ${tokenData.symbol}`);
  console.log(`  Decimals: ${tokenData.decimals}`);
  console.log(`  Initial Supply: ${tokenData.initialSupply / BigInt(10 ** 9)} ${tokenData.symbol}`);
  console.log(`  Total Fee: ${(tokenData.treasuryBps + tokenData.stakingBps + tokenData.marketingBps) / 100}%`);
  
  // Calculate the instruction discriminator
  // This is the first 8 bytes of sha256("global:initialize_token")
  const discriminator = Buffer.from([38, 209, 150, 50, 190, 117, 16, 54]);
  
  // Encode the instruction data
  const nameBytes = Buffer.from(tokenData.name);
  const symbolBytes = Buffer.from(tokenData.symbol);
  
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
    Buffer.from([tokenData.decimals]),
    // initialSupply (u64)
    encodeU64(tokenData.initialSupply),
    // treasury (pubkey - 32 bytes)
    tokenData.treasury.toBuffer(),
    // staking (pubkey - 32 bytes)
    tokenData.staking.toBuffer(),
    // marketing (pubkey - 32 bytes)
    tokenData.marketing.toBuffer(),
    // treasuryBps (u16)
    encodeU16(tokenData.treasuryBps),
    // stakingBps (u16)
    encodeU16(tokenData.stakingBps),
    // marketingBps (u16)
    encodeU16(tokenData.marketingBps),
  ]);
  
  console.log('\n📦 Instruction data size:', instructionData.length, 'bytes');
  
  // Create the instruction
  const initializeTokenIx = new TransactionInstruction({
    programId: TOKEN_FACTORY_PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: tokenConfig, isSigner: false, isWritable: true },
      { pubkey: feeConfig, isSigner: false, isWritable: true },
      { pubkey: feeExemptList, isSigner: false, isWritable: true },
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: PLATFORM_TREASURY, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(initializeTokenIx);
  
  console.log('\n📤 Sending transaction...');
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, mintKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log('\n✅ Token created successfully!');
    console.log('🔗 Transaction signature:', signature);
    console.log(`🔗 View on explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log(`🪙 Token mint: ${mintKeypair.publicKey.toBase58()}`);
    console.log('\n📝 Note: This creates a Token-2022 mint with fee configuration.');
    console.log('   To add metadata (name/symbol/image), use Metaplex metadata in a follow-up transaction.');
    
    return { mint: mintKeypair.publicKey, signature };
  } catch (error) {
    console.error('\n❌ Error creating token:', error);
    if (error instanceof Error && 'logs' in error) {
      console.error('📋 Transaction logs:', (error as any).logs);
    }
    throw error;
  }
}

async function main() {
  const connection = new Connection(DEVNET_URL, 'confirmed');
  
  // Check if we have a saved keypair or create a new one
  const keypairPath = path.join(process.cwd(), 'test-wallet.json');
  let payer: Keypair;
  
  if (fs.existsSync(keypairPath)) {
    console.log('💰 Loading existing wallet...');
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
  } else {
    console.log('💰 Creating new wallet...');
    payer = Keypair.generate();
    fs.writeFileSync(keypairPath, JSON.stringify(Array.from(payer.secretKey)));
    console.log('💾 Wallet saved to:', keypairPath);
  }
  
  console.log('👛 Wallet address:', payer.publicKey.toBase58());
  
  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log('💸 Current balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  
  // Request airdrop if needed
  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.log('\n🚰 Requesting airdrop...');
    try {
      const airdropSignature = await connection.requestAirdrop(
        payer.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
      console.log('✅ Airdrop confirmed!');
      
      // Check new balance
      const newBalance = await connection.getBalance(payer.publicKey);
      console.log('💸 New balance:', newBalance / LAMPORTS_PER_SOL, 'SOL');
    } catch (error) {
      console.error('❌ Airdrop failed:', error);
      console.log('Please fund the wallet manually or try again later.');
      return;
    }
  }
  
  // Create the token
  await createToken(connection, payer);
}

// Run the test
main().catch(console.error);
