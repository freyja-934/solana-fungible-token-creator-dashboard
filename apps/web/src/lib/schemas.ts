import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

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

  imageFile: z
    .custom<File>()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png, .webp and .gif formats are supported'
    ),
});

export type TokenFormData = z.infer<typeof tokenFormSchema>; 