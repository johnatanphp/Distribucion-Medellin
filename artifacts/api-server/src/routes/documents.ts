import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function getUserFromToken(req: any): { id: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [idStr, , , role] = decoded.split(":");
    const id = parseInt(idStr, 10);
    return isNaN(id) ? null : { id, role: role ?? "customer" };
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const { storeId, type } = req.query;
  let rows;
  if (storeId) {
    rows = await db.select().from(documentsTable).where(eq(documentsTable.storeId, parseInt(storeId as string, 10)));
  } else if (user.role === "superadmin") {
    rows = await db.select().from(documentsTable);
  } else {
    rows = await db.select().from(documentsTable).where(eq(documentsTable.userId, user.id));
  }
  if (type) rows = rows.filter((d) => d.type === type);
  res.json(rows.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const { storeId, orderId, name, type, content, url, mimeType, size, tags } = req.body;
  if (!name) return res.status(400).json({ error: "bad_request", message: "name is required" });
  const [doc] = await db.insert(documentsTable).values({
    storeId: storeId ? parseInt(storeId, 10) : null,
    userId: user.id,
    orderId: orderId ? parseInt(orderId, 10) : null,
    name, type: type ?? "other", content, url, mimeType, size, tags
  }).returning();
  res.status(201).json({ ...doc, createdAt: doc.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) return res.status(404).json({ error: "not_found" });
  res.json({ ...doc, createdAt: doc.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.update(documentsTable).set({ status: "deleted" }).where(eq(documentsTable.id, id));
  res.json({ success: true });
});

export default router;
