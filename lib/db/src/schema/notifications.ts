import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  storeId: integer("store_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("info"),
  channel: text("channel").notNull().default("in_app"),
  read: boolean("read").notNull().default(false),
  data: text("data"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, sentAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
