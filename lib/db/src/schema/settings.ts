import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  label: text("label").notNull().default(""),
  category: text("category").notNull().default("general"),
  description: text("description"),
  inputType: text("input_type").notNull().default("text"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settingsTable.$inferSelect;
