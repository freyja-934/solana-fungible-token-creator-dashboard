import { supabase } from '@/lib/supabase/client';
import { Connection, Transaction } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const runtime = 'edge';

interface ExecuteAirdropRequest {
  airdropId: string;
  transactions: {
    serialized: string;
    recipients: Array<{ wallet: string; amount: string }>;
  }[];
  creator: string;
  tokenMint: string;
}

interface ExecutionResult {
  success: boolean;
  transactionSignatures: string[];
  failedBatches: number[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Create edge-compatible connection
    const connection = new Connection(HELIUS_RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });

    // Parse request body
    const body: ExecuteAirdropRequest = await request.json();
    const { airdropId, transactions, creator, tokenMint } = body;

    if (!airdropId || !transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const transactionSignatures: string[] = [];
    const failedBatches: number[] = [];

    // Save initial airdrop record
    await supabase.from('airdrops').insert({
      id: airdropId,
      creator,
      token_mint: tokenMint,
      recipients: transactions.flatMap(tx => tx.recipients),
      tx_ids: [],
      status: 'pending'
    });

    // Process each transaction
    for (let i = 0; i < transactions.length; i++) {
      const { serialized } = transactions[i];
      
      try {
        // Deserialize the transaction
        const transactionBuffer = Buffer.from(serialized, 'base64');
        const transaction = Transaction.from(transactionBuffer);

        // Send the pre-signed transaction
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 3
          }
        );

        // Wait for confirmation
        const latestBlockhash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        transactionSignatures.push(signature);

        // Update progress in database
        await supabase
          .from('airdrops')
          .update({
            tx_ids: transactionSignatures,
            status: i === transactions.length - 1 ? 'success' : 'pending'
          })
          .eq('id', airdropId);

      } catch (error) {
        console.error(`Batch ${i} failed:`, error);
        failedBatches.push(i);
        
        // Continue with other batches
        continue;
      }

      // Add delay between transactions to avoid rate limits
      if (i < transactions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final status update
    const finalStatus = failedBatches.length === 0 ? 'success' : 
                       failedBatches.length === transactions.length ? 'failed' : 'partial';
    
    await supabase
      .from('airdrops')
      .update({
        tx_ids: transactionSignatures,
        status: finalStatus
      })
      .eq('id', airdropId);

    const result: ExecutionResult = {
      success: failedBatches.length === 0,
      transactionSignatures,
      failedBatches
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Airdrop execution error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute airdrop',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 