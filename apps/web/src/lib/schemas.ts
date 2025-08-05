import { z } from 'zod';

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
});

export type TokenFormData = z.infer<typeof tokenFormSchema>; 