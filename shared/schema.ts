import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for custom authentication
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("free"),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
  subscriptionTier: true,
  subscriptionEndsAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerUserSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

// Types for image compression (client-side only)
export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  status: 'ready' | 'compressing' | 'compressed' | 'error';
  progress: number;
  savings?: number;
  savingsPercentage?: number;
  qualityScore?: number;
  qualityGrade?: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  psnr?: number;
  ssim?: number;
}

export interface CompressionSettings {
  quality: number;
  mode: 'balanced' | 'aggressive' | 'gentle';
  webOptimized?: boolean;
  sharpenFilter?: boolean;
  noiseReduction?: boolean;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  paused: number;
  estimatedTimeRemaining: number;
  averageProcessingTime: number;
  totalSavings: number;
  totalSavingsPercentage: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  compressionLimit: number; // -1 for unlimited
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    stripePriceId: '',
    features: [
      'Up to 10 compressions per day',
      'Basic compression modes',
      'Standard quality assessment'
    ],
    compressionLimit: 10
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_premium_monthly', // Will be replaced with actual Stripe price ID
    features: [
      'Unlimited compressions',
      'Advanced compression modes',
      'Professional quality assessment',
      'Batch processing',
      'Priority support'
    ],
    compressionLimit: -1,
    isPopular: true
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 99.99,
    interval: 'year',
    stripePriceId: 'price_premium_yearly', // Will be replaced with actual Stripe price ID
    features: [
      'Unlimited compressions',
      'Advanced compression modes',
      'Professional quality assessment',
      'Batch processing',
      'Priority support',
      '2 months free'
    ],
    compressionLimit: -1
  }
];
