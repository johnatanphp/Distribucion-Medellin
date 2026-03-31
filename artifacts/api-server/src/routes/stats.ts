import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { storesTable, productsTable, salesTable, ratingsTable, usersTable } from "@workspace/db/schema";
import { eq, count, sum, avg, desc, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/global", async (_req, res) => {
  const [storeCount] = await db.select({ count: count() }).from(storesTable);
  const [activeStoreCount] = await db.select({ count: count() }).from(storesTable).where(eq(storesTable.active, true));
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [salesTotal] = await db.select({ total: sum(salesTable.amount) }).from(salesTable);
  const [productCount] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.active, true));

  const recentActivity = await db.select({
    id: salesTable.id,
    storeId: salesTable.storeId,
    amount: salesTable.amount,
    createdAt: salesTable.createdAt,
    storeName: storesTable.name,
    productId: salesTable.productId,
  }).from(salesTable)
    .leftJoin(storesTable, eq(salesTable.storeId, storesTable.id))
    .orderBy(desc(salesTable.createdAt))
    .limit(10);

  const topStores = await db.select({
    id: storesTable.id,
    name: storesTable.name,
    totalSales: sum(salesTable.amount),
    totalProducts: count(productsTable.id),
  }).from(storesTable)
    .leftJoin(salesTable, eq(salesTable.storeId, storesTable.id))
    .leftJoin(productsTable, and(eq(productsTable.storeId, storesTable.id), eq(productsTable.active, true)))
    .groupBy(storesTable.id, storesTable.name)
    .orderBy(desc(sum(salesTable.amount)))
    .limit(5);

  res.json({
    totalStores: Number(storeCount?.count ?? 0),
    activeStores: Number(activeStoreCount?.count ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
    totalSales: Number(salesTotal?.total ?? 0),
    totalProducts: Number(productCount?.count ?? 0),
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      type: "sale",
      description: `Venta por $${Number(a.amount).toLocaleString("es-CO")}`,
      timestamp: a.createdAt.toISOString(),
      storeName: a.storeName ?? "—",
    })),
    topStores: topStores.map(s => ({
      id: s.id,
      name: s.name,
      totalSales: Number(s.totalSales ?? 0),
      totalProducts: Number(s.totalProducts ?? 0),
    })),
  });
});

router.get("/store/:id", async (req, res) => {
  const storeId = parseInt(req.params.id, 10);

  const [totalProducts] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.storeId, storeId));
  const [activeProducts] = await db.select({ count: count() }).from(productsTable).where(and(eq(productsTable.storeId, storeId), eq(productsTable.active, true)));
  const [salesTotal] = await db.select({ total: sum(salesTable.amount) }).from(salesTable).where(eq(salesTable.storeId, storeId));

  const lowStockProducts = await db.select().from(productsTable)
    .where(and(eq(productsTable.storeId, storeId), eq(productsTable.active, true)))
    .limit(100);
  const lowStock = lowStockProducts.filter(p => p.stock < 5);

  const recentSalesRaw = await db.select({
    id: salesTable.id,
    amount: salesTable.amount,
    quantity: salesTable.quantity,
    createdAt: salesTable.createdAt,
    productId: salesTable.productId,
    productName: productsTable.name,
  }).from(salesTable)
    .leftJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .where(eq(salesTable.storeId, storeId))
    .orderBy(desc(salesTable.createdAt))
    .limit(10);

  const [ratingAvg] = await db.select({ avg: avg(ratingsTable.stars) })
    .from(ratingsTable)
    .leftJoin(productsTable, eq(ratingsTable.productId, productsTable.id))
    .where(eq(productsTable.storeId, storeId));

  res.json({
    totalProducts: Number(totalProducts?.count ?? 0),
    activeProducts: Number(activeProducts?.count ?? 0),
    totalSales: Number(salesTotal?.total ?? 0),
    avgRating: ratingAvg?.avg ? Number(ratingAvg.avg) : 0,
    lowStockProducts: lowStock.map(p => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
    })),
    recentSales: recentSalesRaw.map(s => ({
      id: s.id,
      productName: s.productName ?? "Producto",
      amount: Number(s.amount),
      quantity: s.quantity,
      timestamp: s.createdAt.toISOString(),
    })),
  });
});

export default router;
