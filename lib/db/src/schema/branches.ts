import { pgTable, text, serial, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  lat: real("lat"),
  lng: real("lng"),
  active: boolean("active").notNull().default(true),
  managerName: text("manager_name"),
  openHours: text("open_hours").default("Lun-Vie 8:00-18:00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branchesTable).omit({ id: true, createdAt: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branchesTable.$inferSelect;
