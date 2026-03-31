import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { storesTable, productsTable, salesTable } from "@workspace/db/schema";
import { eq, count, sum, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { active } = req.query;
  let query = db.select().from(storesTable);
  if (active !== undefined) {
    const rows = await db.select().from(storesTable).where(eq(storesTable.active, active === "true"));
    const enriched = await Promise.all(rows.map(enrichStore));
    return res.json(enriched);
  }
  const rows = await query;
  const enriched = await Promise.all(rows.map(enrichStore));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const { name, address, phone, email, lat, lng, description } = req.body;
  if (!name || !address || !phone || !email || lat == null || lng == null) {
    return res.status(400).json({ error: "bad_request", message: "Missing required fields" });
  }
  const [store] = await db.insert(storesTable).values({ name, address, phone, email, lat, lng, description: description || "" }).returning();
  res.status(201).json(await enrichStore(store));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await db.select().from(storesTable).where(eq(storesTable.id, id));
  if (!rows[0]) return res.status(404).json({ error: "not_found", message: "Store not found" });
  res.json(await enrichStore(rows[0]));
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, address, phone, email, lat, lng, description } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (lat !== undefined) updates.lat = lat;
  if (lng !== undefined) updates.lng = lng;
  if (description !== undefined) updates.description = description;
  const [store] = await db.update(storesTable).set(updates).where(eq(storesTable.id, id)).returning();
  if (!store) return res.status(404).json({ error: "not_found", message: "Store not found" });
  res.json(await enrichStore(store));
});

router.post("/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await db.select().from(storesTable).where(eq(storesTable.id, id));
  if (!rows[0]) return res.status(404).json({ error: "not_found", message: "Store not found" });
  const [store] = await db.update(storesTable).set({ active: !rows[0].active }).where(eq(storesTable.id, id)).returning();
  res.json(await enrichStore(store));
});

router.get("/:id/products", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await db.select().from(productsTable).where(and(eq(productsTable.storeId, id), eq(productsTable.active, true)));
  const enriched = await Promise.all(rows.map(enrichProduct));
  res.json(enriched);
});

async function enrichStore(store: typeof storesTable.$inferSelect) {
  const [prodCount] = await db.select({ count: count() }).from(productsTable).where(and(eq(productsTable.storeId, store.id), eq(productsTable.active, true)));
  const [salesSum] = await db.select({ total: sum(salesTable.amount) }).from(salesTable).where(eq(salesTable.storeId, store.id));
  return {
    ...store,
    totalProducts: Number(prodCount?.count ?? 0),
    totalSales: Number(salesSum?.total ?? store.totalSales ?? 0),
    createdAt: store.createdAt.toISOString(),
  };
}

async function enrichProduct(p: typeof productsTable.$inferSelect) {
  return {
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
