import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
