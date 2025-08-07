import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
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
  const [platformConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    PROGRAM_ID
  );
  
  console.log('Platform config PDA:', platformConfig.toBase58());
  
  // Check if already initialized
  const accountInfo = await connection.getAccountInfo(platformConfig);
  if (accountInfo) {
    console.log('Platform already initialized!');
    return;
  }
  
  // Treasury wallet (you should use your own treasury wallet)
  const treasury = walletKeypair.publicKey; // Using same wallet for testing
  
  // Create initialize platform instruction
  const idl = JSON.parse(fs.readFileSync(path.resolve('../programs/token_factory/target/idl/token_factory.json'), 'utf-8'));
  
  // Add the address field to the IDL (Anchor expects this)
  idl.address = PROGRAM_ID.toBase58();
  
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );
  
  // Set the provider
  anchor.setProvider(provider);
  
  // Create program with explicit program ID
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  
  try {
    const tx = await program.methods
      .initializePlatform(treasury)
      .accounts({
        authority: walletKeypair.publicKey,
        platformConfig: platformConfig,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    console.log('Platform initialized successfully!');
    console.log('Transaction signature:', tx);
    console.log('Treasury wallet:', treasury.toBase58());
  } catch (error) {
    console.error('Error initializing platform:', error);
  }
}

initializePlatform().catch(console.error); 