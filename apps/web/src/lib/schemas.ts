import { z } from 'zod';

export const tokenFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Token name is required')
    .max(50, 'Token name must be 50 characters or less'),
  
  symbol: z
    .string()
    .min(1, 'Token symbol is required')
    .max(10, 'Token symbol must be 10 characters or less')
    .toUpperCase(),
  
  decimals: z
    .number()
    .int()
    .min(0, 'Decimals must be at least 0')
    .max(9, 'Decimals must be 9 or less'),
  
  initialSupply: z
    .string()
    .min(1, 'Initial supply is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Initial supply must be a positive number',
    }),
  
  freezeAuthority: z.boolean(),
  
  mintAuthority: z.boolean(),
  
  description: z.string().optional(),
  
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export type TokenFormData = z.infer<typeof tokenFormSchema>; 