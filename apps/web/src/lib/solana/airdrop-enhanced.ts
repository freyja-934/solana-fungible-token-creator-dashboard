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
import { AirdropRecipient } from './airdrop';

const RECIPIENTS_PER_TRANSACTION = 10;

export interface PreparedTransaction {
  transaction: Transaction;
  recipients: AirdropRecipient[];
  estimatedFee: number;
}

export interface SerializedAirdrop {
  id: string;
  transactions: {
    serialized: string;
    recipients: AirdropRecipient[];
  }[];
  tokenMint: string;
  totalAmount: number;
  totalRecipients: number;
  createdAt: string;
}

/**
 * Prepare all transactions for an airdrop without signing
 * This allows us to estimate fees and validate everything upfront
 */
export async function prepareAirdropTransactions(
  connection: Connection,
  payer: PublicKey,
  tokenMint: PublicKey,
  recipients: AirdropRecipient[],
  decimals: number
): Promise<PreparedTransaction[]> {
  const preparedTransactions: PreparedTransaction[] = [];
  
  // Get payer's token account
  const payerAta = await getAssociatedTokenAddress(tokenMint, payer);
  
  // Verify payer has token account
  try {
    await getAccount(connection, payerAta);
  } catch {
    throw new Error('Payer does not have a token account for this token');
  }

  // Split recipients into batches
  const batches: AirdropRecipient[][] = [];
  for (let i = 0; i < recipients.length; i += RECIPIENTS_PER_TRANSACTION) {
    batches.push(recipients.slice(i, i + RECIPIENTS_PER_TRANSACTION));
  }

  // Prepare transaction for each batch
  for (const batch of batches) {
    const transaction = new Transaction();
    const batchRecipients: AirdropRecipient[] = [];

    // Build instructions for this batch
    for (const recipient of batch) {
      try {
        const recipientPubkey = new PublicKey(recipient.wallet);
        const recipientAta = await getAssociatedTokenAddress(tokenMint, recipientPubkey);
        
        // Check if recipient needs token account
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

        batchRecipients.push(recipient);
      } catch (error) {
        console.error(`Failed to prepare transfer for ${recipient.wallet}:`, error);
        throw new Error(`Invalid recipient: ${recipient.wallet}`);
      }
    }

    if (transaction.instructions.length > 0) {
      // Get latest blockhash for fee estimation
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      // Estimate fee
      const message = transaction.compileMessage();
      const estimatedFee = await connection.getFeeForMessage(message, 'confirmed');

      preparedTransactions.push({
        transaction,
        recipients: batchRecipients,
        estimatedFee: estimatedFee.value || 5000
      });
    }
  }

  return preparedTransactions;
}

/**
 * Sign all prepared transactions
 * This happens on the client side with the user's wallet
 */
export async function signAirdropTransactions(
  preparedTransactions: PreparedTransaction[],
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<SerializedAirdrop> {
  const signedTransactions: { serialized: string; recipients: AirdropRecipient[] }[] = [];
  let totalAmount = 0;

  for (const prepared of preparedTransactions) {
    try {
      // Sign the transaction
      const signedTx = await signTransaction(prepared.transaction);
      
      // Serialize for storage/transmission
      const serialized = signedTx.serialize().toString('base64');
      
      signedTransactions.push({
        serialized,
        recipients: prepared.recipients
      });

      // Calculate total amount
      totalAmount += prepared.recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw new Error('Failed to sign all transactions');
    }
  }

  return {
    id: `airdrop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transactions: signedTransactions,
    tokenMint: preparedTransactions[0].transaction.instructions[0].programId.toBase58(),
    totalAmount,
    totalRecipients: signedTransactions.reduce((sum, tx) => sum + tx.recipients.length, 0),
    createdAt: new Date().toISOString()
  };
}

/**
 * Calculate total fees for all transactions
 */
export function calculateTotalFees(preparedTransactions: PreparedTransaction[]): number {
  return preparedTransactions.reduce((total, tx) => total + tx.estimatedFee, 0);
}

/**
 * Validate all recipients have valid addresses
 */
export function validateRecipients(recipients: AirdropRecipient[]): {
  valid: AirdropRecipient[];
  invalid: AirdropRecipient[];
} {
  const valid: AirdropRecipient[] = [];
  const invalid: AirdropRecipient[] = [];

  for (const recipient of recipients) {
    try {
      new PublicKey(recipient.wallet);
      const amount = parseFloat(recipient.amount);
      if (!isNaN(amount) && amount > 0) {
        valid.push(recipient);
      } else {
        invalid.push(recipient);
      }
    } catch {
      invalid.push(recipient);
    }
  }

  return { valid, invalid };
} 