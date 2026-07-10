import { z } from 'zod';

// Base User Schema
export const UserSchema = z.object({
  username: z.string(),
  fullName: z.string(),
  isActive: z.boolean().default(true),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  roles: z.array(z.string()).optional(),
});

export type User = z.infer<typeof UserSchema>;

// Base Facility Schema
export const FacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean().default(true),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  employeeCount: z.number().default(0),
  dangerClass: z.enum(['Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli']).default('Az Tehlikeli'),
});

export type Facility = z.infer<typeof FacilitySchema>;

// API Response Wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
