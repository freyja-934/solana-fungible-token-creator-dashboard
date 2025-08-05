import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAccount,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import {
    Connection,
    PublicKey,
    Transaction
} from '@solana/web3.js';

const RECIPIENTS_PER_TRANSACTION = 10;

export interface AirdropRecipient {
  wallet: string;
  amount: string;
}

export interface AirdropProgress {
  totalRecipients: number;
  processedRecipients: number;
  successfulTransactions: string[];
  failedRecipients: AirdropRecipient[];
  currentBatch: number;
  totalBatches: number;
}

export interface AirdropResult {
  success: boolean;
  transactionSignatures: string[];
  failedRecipients: AirdropRecipient[];
  totalSent: number;
}

export async function executeAirdrop(
  connection: Connection,
  payer: PublicKey,
  tokenMint: PublicKey,
  recipients: AirdropRecipient[],
  decimals: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  onProgress?: (progress: AirdropProgress) => void
): Promise<AirdropResult> {
  const transactionSignatures: string[] = [];
  const failedRecipients: AirdropRecipient[] = [];
  let totalSent = 0;

  // Get payer's token account
  const payerAta = await getAssociatedTokenAddress(tokenMint, payer);
  
  // Check if payer has token account
  try {
    await getAccount(connection, payerAta);
  } catch (error) {
    throw new Error('Payer does not have a token account for this token');
  }

  // Split recipients into batches
  const batches: AirdropRecipient[][] = [];
  for (let i = 0; i < recipients.length; i += RECIPIENTS_PER_TRANSACTION) {
    batches.push(recipients.slice(i, i + RECIPIENTS_PER_TRANSACTION));
  }

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    try {
      const transaction = new Transaction();
      const recipientsToProcess: { recipient: AirdropRecipient; ata: PublicKey }[] = [];

      // Build instructions for this batch
      for (const recipient of batch) {
        try {
          const recipientPubkey = new PublicKey(recipient.wallet);
          const recipientAta = await getAssociatedTokenAddress(tokenMint, recipientPubkey);
          
          // Check if recipient has token account
          let needsAccount = false;
          try {
            await getAccount(connection, recipientAta);
          } catch {
            needsAccount = true;
          }

          // Add create account instruction if needed
          if (needsAccount) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                payer,
                recipientAta,
                recipientPubkey,
                tokenMint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
            );
          }

          // Add transfer instruction
          const amount = BigInt(parseFloat(recipient.amount) * Math.pow(10, decimals));
          transaction.add(
            createTransferInstruction(
              payerAta,
              recipientAta,
              payer,
              amount,
              [],
              TOKEN_PROGRAM_ID
            )
          );

          recipientsToProcess.push({ recipient, ata: recipientAta });
        } catch (error) {
          console.error(`Failed to prepare transfer for ${recipient.wallet}:`, error);
          failedRecipients.push(recipient);
        }
      }

      // Skip if no valid recipients in this batch
      if (transaction.instructions.length === 0) {
        continue;
      }

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);

      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      transactionSignatures.push(signature);

      // Update total sent
      for (const { recipient } of recipientsToProcess) {
        totalSent += parseFloat(recipient.amount);
      }

      // Report progress
      if (onProgress) {
        onProgress({
          totalRecipients: recipients.length,
          processedRecipients: Math.min((batchIndex + 1) * RECIPIENTS_PER_TRANSACTION, recipients.length),
          successfulTransactions: transactionSignatures,
          failedRecipients,
          currentBatch: batchIndex + 1,
          totalBatches: batches.length
        });
      }
    } catch (error) {
      console.error(`Batch ${batchIndex + 1} failed:`, error);
      // Add all recipients in this batch to failed list
      failedRecipients.push(...batch);
    }
  }

  return {
    success: failedRecipients.length === 0,
    transactionSignatures,
    failedRecipients,
    totalSent
  };
}

// Utility to estimate transaction fees
export function estimateAirdropFees(recipientCount: number): number {
  const batchCount = Math.ceil(recipientCount / RECIPIENTS_PER_TRANSACTION);
  // Estimate ~5000 lamports per transaction + potential account creation fees
  return batchCount * 0.000005;
} 