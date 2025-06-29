import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple schema for this compression app - no database needed for core functionality
// Just keeping the user schema for potential future auth features

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
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
}

export interface CompressionSettings {
  quality: number;
  mode: 'balanced' | 'aggressive' | 'gentle';
}
