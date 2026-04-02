import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fcmTokensTable = pgTable("fcm_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull().default("web"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFcmTokenSchema = createInsertSchema(fcmTokensTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFcmToken = z.infer<typeof insertFcmTokenSchema>;
export type FcmToken = typeof fcmTokensTable.$inferSelect;
