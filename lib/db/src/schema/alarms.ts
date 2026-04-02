import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alarmsTable = pgTable("alarms", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  repeatType: text("repeat_type").notNull().default("none"),
  isActive: boolean("is_active").notNull().default(true),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlarmSchema = createInsertSchema(alarmsTable).omit({ id: true, createdAt: true });
export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarmsTable.$inferSelect;
