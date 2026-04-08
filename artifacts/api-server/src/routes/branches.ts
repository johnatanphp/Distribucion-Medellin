import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { branchesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { storeId } = req.query;
  let rows;
  if (storeId) {
    rows = await db.select().from(branchesTable).where(eq(branchesTable.storeId, parseInt(storeId as string, 10)));
  } else {
    rows = await db.select().from(branchesTable);
  }
  res.json(rows.map(b => ({ ...b, createdAt: b.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { storeId, name, address, phone, lat, lng, managerName, openHours, notes } = req.body;
  if (!storeId || !name || !address) {
    return res.status(400).json({ error: "bad_request", message: "storeId, name and address are required" });
  }
  const [branch] = await db.insert(branchesTable).values({
    storeId: parseInt(storeId, 10), name, address, phone, lat, lng, managerName, openHours, notes
  }).returning();
  res.status(201).json({ ...branch, createdAt: branch.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, id));
  if (!branch) return res.status(404).json({ error: "not_found" });
  res.json({ ...branch, createdAt: branch.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, address, phone, lat, lng, active, managerName, openHours, notes } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (lat !== undefined) updates.lat = lat;
  if (lng !== undefined) updates.lng = lng;
  if (active !== undefined) updates.active = active;
  if (managerName !== undefined) updates.managerName = managerName;
  if (openHours !== undefined) updates.openHours = openHours;
  if (notes !== undefined) updates.notes = notes;
  const [branch] = await db.update(branchesTable).set(updates).where(eq(branchesTable.id, id)).returning();
  if (!branch) return res.status(404).json({ error: "not_found" });
  res.json({ ...branch, createdAt: branch.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.delete(branchesTable).where(eq(branchesTable.id, id));
  res.json({ success: true });
});

export default router;
