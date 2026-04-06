import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, salesTable, storesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getUserFromToken(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [idStr] = decoded.split(":");
    const userId = parseInt(idStr, 10);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  const userId = getUserFromToken(req);
  if (!userId) return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId));

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
      return {
        ...order,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        items: items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          createdAt: item.createdAt.toISOString(),
        })),
      };
    })
  );

  res.json(ordersWithItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.post("/", async (req, res) => {
  const userId = getUserFromToken(req);
  if (!userId) return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "bad_request", message: "Items are required" });
  }

  let total = 0;
  const enrichedItems: {
    productId: number;
    storeId: number;
    productName: string;
    storeName: string;
    quantity: number;
    unitPrice: string;
  }[] = [];

  for (const item of items) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, item.productId));
    if (!product) {
      return res.status(400).json({ error: "bad_request", message: `Product ${item.productId} not found` });
    }
    const [store] = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, product.storeId));

    const unitPrice = Number(product.price);
    const quantity = Math.max(1, item.quantity || 1);
    total += unitPrice * quantity;

    enrichedItems.push({
      productId: product.id,
      storeId: product.storeId,
      productName: product.name,
      storeName: store?.name || "Tienda",
      quantity,
      unitPrice: String(unitPrice),
    });
  }

  const [order] = await db
    .insert(ordersTable)
    .values({ userId, status: "completed", total: String(total) })
    .returning();

  const orderItems = await db
    .insert(orderItemsTable)
    .values(enrichedItems.map((item) => ({ orderId: order.id, ...item })))
    .returning();

  for (const item of enrichedItems) {
    await db.insert(salesTable).values({
      productId: item.productId,
      storeId: item.storeId,
      userId,
      quantity: item.quantity,
      amount: String(Number(item.unitPrice) * item.quantity),
    });
  }

  res.status(201).json({
    ...order,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: orderItems.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      createdAt: item.createdAt.toISOString(),
    })),
  });
});

export default router;
