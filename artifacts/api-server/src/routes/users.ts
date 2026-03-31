import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const rows = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    storeId: usersTable.storeId,
    active: usersTable.active,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(rows.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

export default router;
