import { TokenFormData } from '@/lib/schemas';
import {
    createFungible,
    mintV1,
    TokenStandard
} from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount, Umi } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';

export interface CreateTokenResult {
  mint: string;
  transactionSignature: string;
  metadataUri?: string;
}

export async function createSplToken(
  umi: Umi,
  formData: TokenFormData,
  metadataUri?: string
): Promise<CreateTokenResult> {
  try {
    // Ensure wallet is connected
    if (!umi.identity) {
      throw new Error('Wallet not connected');
    }

    const mint = generateSigner(umi);

    // Determine if token should be mutable based on authorities
    const isMutable = formData.mintAuthority !== 'none' || formData.freezeAuthority;

    const createTokenInstruction = createFungible(umi, {
      mint,
      name: formData.name,
      symbol: formData.symbol,
      uri: metadataUri || '',
      sellerFeeBasisPoints: percentAmount(0),
      decimals: formData.decimals,
      printSupply: null,
      isMutable,
    });

    const initialSupply = BigInt(
      parseFloat(formData.initialSupply) * Math.pow(10, formData.decimals)
    );

    const mintTokenInstruction = mintV1(umi, {
      mint: mint.publicKey,
      authority: umi.identity,
      amount: initialSupply,
      tokenOwner: umi.identity.publicKey,
      tokenStandard: TokenStandard.Fungible,
    });

    // Build transaction
    const builder = createTokenInstruction.append(mintTokenInstruction);

    // Send and confirm with error handling
    let result;
    try {
      result = await builder.sendAndConfirm(umi, {
        confirm: { commitment: 'confirmed' },
      });
    } catch (sendError: unknown) {
      console.error('Transaction send error:', sendError);
      const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
      throw new Error(`Failed to send transaction: ${errorMessage}`);
    }

    return {
      mint: mint.publicKey,
      transactionSignature: base58.deserialize(result.signature)[0],
    };
  } catch (error: unknown) {
    console.error('Token creation error:', error);
    throw error;
  }
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
} 