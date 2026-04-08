import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function getUserFromToken(req: any): { id: number; role: string; storeId?: number } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    const id = parseInt(parts[0], 10);
    return isNaN(id) ? null : { id, role: parts[3] ?? "customer" };
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  let rows;
  if (user.role === "superadmin") {
    rows = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.sentAt)).limit(100);
  } else {
    rows = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, user.id))
      .orderBy(desc(notificationsTable.sentAt)).limit(50);
  }
  res.json(rows.map(n => ({ ...n, sentAt: n.sentAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { userId, storeId, title, body, type, channel, data } = req.body;
  if (!title || !body) return res.status(400).json({ error: "bad_request", message: "title and body required" });
  const [notif] = await db.insert(notificationsTable).values({
    userId: userId ?? null, storeId: storeId ?? null,
    title, body, type: type ?? "info", channel: channel ?? "in_app", data: data ?? null
  }).returning();
  res.status(201).json({ ...notif, sentAt: notif.sentAt.toISOString() });
});

router.put("/:id/read", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [notif] = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id)).returning();
  if (!notif) return res.status(404).json({ error: "not_found" });
  res.json({ ...notif, sentAt: notif.sentAt.toISOString() });
});

router.put("/read-all", async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  await db.update(notificationsTable).set({ read: true }).where(
    and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false))
  );
  res.json({ success: true });
});

export default router;
