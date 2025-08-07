import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PROGRAM_ID = new PublicKey('7RSKqnZYg6wsPyHAjKK1i7RCYrYoyoSDw2AaPxMnAnWT'); // Deployed devnet program
const DEVNET_RPC = 'https://api.devnet.solana.com';

function getInstructionDiscriminator(instructionName: string): Buffer {
  const hash = crypto.createHash('sha256').update(`global:${instructionName}`).digest();
  return hash.slice(0, 8);
}

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
  console.log('Checking program exists...');
  
  // Check if program exists
  const programInfo = await connection.getAccountInfo(PROGRAM_ID);
  if (!programInfo) {
    console.error('Program not found at:', PROGRAM_ID.toBase58());
    return;
  }
  console.log('Program found, executable:', programInfo.executable);
  
  // Check if already initialized
  const accountInfo = await connection.getAccountInfo(platformConfig);
  if (accountInfo) {
    console.log('Platform already initialized!');
    console.log('Account owner:', accountInfo.owner.toBase58());
    console.log('Account data length:', accountInfo.data.length);
    return;
  }
  
  // Treasury wallet (you should use your own treasury wallet)
  const treasury = walletKeypair.publicKey; // Using same wallet for testing
  
  // Calculate the correct discriminator
  const discriminator = getInstructionDiscriminator('initialize_platform');
  
  // Encode treasury pubkey (32 bytes)
  const treasuryBytes = treasury.toBuffer();
  
  // Combine discriminator + treasury
  const instructionData = Buffer.concat([discriminator, treasuryBytes]);
  
  console.log('Instruction data length:', instructionData.length);
  console.log('Discriminator:', discriminator.toString('hex'));
  console.log('Treasury:', treasury.toBase58());
  
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
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletKeypair.publicKey;
    
    // Sign transaction
    transaction.sign(walletKeypair);
    
    // Send raw transaction
    const rawTransaction = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction);
    
    console.log('Transaction sent:', signature);
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('Platform initialized successfully!');
    console.log('Transaction signature:', signature);
    console.log('Treasury wallet:', treasury.toBase58());
    console.log('Explorer link:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (error) {
    console.error('Error initializing platform:', error);
    if (error instanceof Error && 'logs' in error) {
      console.error('Transaction logs:', (error as any).logs);
    }
  }
}

initializePlatform().catch(console.error); 