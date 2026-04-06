import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, ratingsTable, storesTable } from "@workspace/db/schema";
import { eq, avg, count, lte, gte, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { storeId, minPrice, maxPrice, category } = req.query;

  let rows = await db.select().from(productsTable).where(eq(productsTable.active, true));

  if (storeId) rows = rows.filter((p) => p.storeId === Number(storeId));
  if (minPrice) rows = rows.filter((p) => Number(p.price) >= Number(minPrice));
  if (maxPrice) rows = rows.filter((p) => Number(p.price) <= Number(maxPrice));
  if (category) rows = rows.filter((p) => p.category === String(category));

  const enriched = await Promise.all(rows.map(enrichProduct));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const { name, description, price, category, imageUrl, stock, storeId } = req.body;
  if (!name || !description || price == null || !category || storeId == null) {
    return res.status(400).json({ error: "bad_request", message: "Missing required fields" });
  }
  const [product] = await db
    .insert(productsTable)
    .values({ name, description, price: String(price), category, imageUrl, stock: stock ?? 0, storeId })
    .returning();
  res.status(201).json(await enrichProduct(product));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!rows[0]) return res.status(404).json({ error: "not_found", message: "Product not found" });
  res.json(await enrichProduct(rows[0]));
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, price, category, imageUrl, stock, active } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = String(price);
  if (category !== undefined) updates.category = category;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (stock !== undefined) updates.stock = stock;
  if (active !== undefined) updates.active = active;
  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) return res.status(404).json({ error: "not_found", message: "Product not found" });
  res.json(await enrichProduct(product));
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [product] = await db.update(productsTable).set({ active: false }).where(eq(productsTable.id, id)).returning();
  if (!product) return res.status(404).json({ error: "not_found", message: "Product not found" });
  res.json({ success: true, message: "Product deactivated" });
});

async function enrichProduct(p: typeof productsTable.$inferSelect) {
  const [ratingRow] = await db
    .select({ avg: avg(ratingsTable.stars), total: count(ratingsTable.id) })
    .from(ratingsTable)
    .where(eq(ratingsTable.productId, p.id));

  const [store] = await db.select({ name: storesTable.name }).from(storesTable).where(eq(storesTable.id, p.storeId));

  return {
    ...p,
    price: Number(p.price),
    storeName: store?.name ?? "",
    avgRating: ratingRow?.avg ? Number(ratingRow.avg) : 0,
    totalRatings: ratingRow?.total ?? 0,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
