import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id"),
  userId: integer("user_id"),
  orderId: integer("order_id"),
  name: text("name").notNull(),
  type: text("type").notNull().default("other"),
  content: text("content"),
  url: text("url"),
  mimeType: text("mime_type").default("application/pdf"),
  size: integer("size"),
  tags: text("tags"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
