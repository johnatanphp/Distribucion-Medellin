import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, ratingsTable } from "@workspace/db/schema";
import { eq, avg } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { storeId } = req.query;
  let rows;
  if (storeId) {
    rows = await db.select().from(productsTable).where(eq(productsTable.storeId, Number(storeId)));
  } else {
    rows = await db.select().from(productsTable);
  }
  const enriched = await Promise.all(rows.map(enrichProduct));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const { name, description, price, category, imageUrl, stock, storeId } = req.body;
  if (!name || !description || price == null || !category || storeId == null) {
    return res.status(400).json({ error: "bad_request", message: "Missing required fields" });
  }
  const [product] = await db.insert(productsTable).values({
    name, description, price: String(price), category, imageUrl, stock: stock ?? 0, storeId,
  }).returning();
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
  const [ratingRow] = await db.select({ avg: avg(ratingsTable.stars) }).from(ratingsTable).where(eq(ratingsTable.productId, p.id));
  return {
    ...p,
    price: Number(p.price),
    avgRating: ratingRow?.avg ? Number(ratingRow.avg) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
