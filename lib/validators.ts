import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().min(2),
  phone: z.string().regex(/^\d{11}$/, 'رقم الهاتف لازم يكون 11 رقم').optional(),
  role: z.enum(['customer', 'merchant']).default('customer'),
  password: z.string()
    .min(8, 'كلمة السر لازم تكون 8 حروف على الأقل')
    .regex(/[A-Z]/, 'كلمة السر لازم تحتوي على حرف كبير')
    .regex(/\d/, 'كلمة السر لازم تحتوي على رقم')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'كلمة السر لازم تحتوي على رمز'),
});

export const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string(),
  gender_filter: z.enum(['male', 'female', 'kids', 'unisex']),
  stock_quantity: z.number().nonnegative()
});
