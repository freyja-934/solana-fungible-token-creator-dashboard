import { BorshCoder } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const PROGRAM_ID = new PublicKey('xCtaFUv4D3NRP5NGvaf3uSSKgD1cbbi9mUaJgNJNYc1');
const DEVNET_RPC = 'https://api.devnet.solana.com';

async function initializePlatform() {
  // Load your wallet keypair
  const walletPath = process.env.SOLANA_WALLET || path.join(process.env.HOME!, '.config/solana/id.json');
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  
  console.log('Using wallet:', walletKeypair.publicKey.toBase58());
  
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  // Get platform config PDA
  const [platformConfig, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    PROGRAM_ID
  );
  
  console.log('Platform config PDA:', platformConfig.toBase58());
  
  // Check if already initialized
  const accountInfo = await connection.getAccountInfo(platformConfig);
  if (accountInfo) {
    console.log('Platform already initialized!');
    console.log('Account data length:', accountInfo.data.length);
    return;
  }
  
  // Treasury wallet (you should use your own treasury wallet)
  const treasury = walletKeypair.publicKey; // Using same wallet for testing
  
  // Load IDL for encoding
  const idl = JSON.parse(fs.readFileSync(path.resolve('../programs/token_factory/target/idl/token_factory.json'), 'utf-8'));
  const coder = new BorshCoder(idl);
  
  // Encode the instruction data
  const instructionData = coder.instruction.encode('initializePlatform', {
    treasury: treasury,
  });
  
  // Create the instruction
  const initializeIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(initializeIx);
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [walletKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log('Platform initialized successfully!');
    console.log('Transaction signature:', signature);
    console.log('Treasury wallet:', treasury.toBase58());
    console.log('Explorer link:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (error) {
    console.error('Error initializing platform:', error);
  }
}

initializePlatform().catch(console.error); 