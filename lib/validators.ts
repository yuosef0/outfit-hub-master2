import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().min(2),
  role: z.enum(['customer', 'merchant']).default('customer')
});

export const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string(),
  gender_filter: z.enum(['male', 'female', 'kids', 'unisex']),
  stock_quantity: z.number().nonnegative()
});
