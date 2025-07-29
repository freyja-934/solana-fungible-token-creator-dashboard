import { TokenFormData } from '@/lib/schemas';
import {
    createFungible,
    mintV1,
    TokenStandard
} from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount, Umi } from '@metaplex-foundation/umi';

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

  let builder = createTokenInstruction
    .append(mintTokenInstruction);

  const result = await builder.sendAndConfirm(umi);

  return {
    mint: mint.publicKey.toString(),
    transactionSignature: result.signature.toString(),
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