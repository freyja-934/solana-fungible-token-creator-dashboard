import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

// Helper to validate Solana public key
const publicKeySchema = z.string().refine(
  (val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid Solana wallet address' }
);

// Optional public key schema - allows empty strings
const optionalPublicKeySchema = z.string().transform((val) => val || '').refine(
  (val) => {
    if (!val || val === '') return true; // Empty is valid
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid Solana wallet address' }
);

export const tokenFormSchema = z.object({
  name: z.string().min(1, 'Token name is required').max(32, 'Token name must be 32 characters or less'),
  symbol: z.string().min(1, 'Token symbol is required').max(10, 'Token symbol must be 10 characters or less'),
  decimals: z.number().min(0).max(9),
  initialSupply: z.string().min(1, 'Initial supply is required'),
  description: z.string().optional(),
  imageFile: z.instanceof(File, { message: 'Token logo is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only .jpg, .png, .webp, and .gif files are accepted'
    ),
  mintAuthority: z.enum(['self', 'none', 'custom']),
  customMintAuthority: z.string().optional(),
  freezeAuthority: z.boolean(),
  
  // Fee configuration fields
  treasuryWallet: optionalPublicKeySchema.optional().default(''),
  stakingWallet: optionalPublicKeySchema.optional().default(''),
  marketingWallet: optionalPublicKeySchema.optional().default(''),
  treasuryBps: z.number().min(0).max(1000).default(0), // 0-10%
  stakingBps: z.number().min(0).max(1000).default(0),   // 0-10%
  marketingBps: z.number().min(0).max(1000).default(0), // 0-10%
}).refine((data) => {
  // Ensure total fees don't exceed 10% (1000 basis points)
  const totalBps = data.treasuryBps + data.stakingBps + data.marketingBps;
  return totalBps <= 1000;
}, {
  message: 'Total fees cannot exceed 10%',
  path: ['treasuryBps'], // Show error on first fee field
});

export type TokenFormData = z.infer<typeof tokenFormSchema>; 