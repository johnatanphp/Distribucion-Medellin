import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

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

router.post("/", async (req, res) => {
  const { email, name, password, role, storeId } = req.body;
  if (!email || !name || !password || !role) {
    res.status(400).json({ error: "bad_request", message: "Missing required fields" });
    return;
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase().trim(),
      name,
      password: hashed,
      role,
      storeId: storeId || null,
      active: true,
    }).returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      storeId: usersTable.storeId,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    });
    res.status(201).json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "conflict", message: "Este correo ya está registrado" });
      return;
    }
    throw err;
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role, active, storeId } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (active !== undefined) updates.active = active;
  if (storeId !== undefined) updates.storeId = storeId;

  const [user] = await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      storeId: usersTable.storeId,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    });

  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!deleted) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  res.json({ success: true, message: "User deleted" });
});

export default router;
