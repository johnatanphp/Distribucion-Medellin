import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const rows = await db.select().from(settingsTable);
  res.json(rows.map(s => ({ ...s, updatedAt: s.updatedAt.toISOString() })));
});

router.get("/:key", async (req, res) => {
  const [setting] = await db.select().from(settingsTable).where(eq(settingsTable.key, req.params.key));
  if (!setting) return res.status(404).json({ error: "not_found" });
  res.json({ ...setting, updatedAt: setting.updatedAt.toISOString() });
});

router.put("/:key", async (req, res) => {
  const { value } = req.body;
  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, req.params.key));
  if (!existing) return res.status(404).json({ error: "not_found", message: "Setting not found" });
  const [updated] = await db.update(settingsTable)
    .set({ value, updatedAt: sql`now()` })
    .where(eq(settingsTable.key, req.params.key))
    .returning();
  res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
});

router.post("/batch", async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: "bad_request" });
  const results = [];
  for (const { key, value } of updates) {
    const [updated] = await db.update(settingsTable)
      .set({ value, updatedAt: sql`now()` })
      .where(eq(settingsTable.key, key))
      .returning();
    if (updated) results.push({ ...updated, updatedAt: updated.updatedAt.toISOString() });
  }
  res.json(results);
});

export default router;
