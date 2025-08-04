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
  const mint = generateSigner(umi);

  const createTokenInstruction = createFungible(umi, {
    mint,
    name: formData.name,
    symbol: formData.symbol,
    uri: metadataUri || '',
    sellerFeeBasisPoints: percentAmount(0),
    decimals: formData.decimals,
    printSupply: null,
    isMutable: formData.mintAuthority || formData.freezeAuthority,
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

  const builder = createTokenInstruction
    .append(mintTokenInstruction);

  const result = await builder.sendAndConfirm(umi);

  // Convert the signature from Uint8Array to base58 string
  const signatureString = base58.deserialize(result.signature)[0];

  return {
    mint: mint.publicKey.toString(),
    transactionSignature: signatureString,
    metadataUri,
  };
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
} 