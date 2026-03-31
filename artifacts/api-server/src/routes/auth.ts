import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "bad_request", message: "Correo y contraseña son requeridos" });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: "invalid_credentials", message: "Correo o contraseña incorrectos" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "invalid_credentials", message: "Correo o contraseña incorrectos" });
    }

    if (!user.active) {
      return res.status(401).json({ error: "inactive", message: "Cuenta inactiva. Contacta al administrador" });
    }

    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64");

    const userOut = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    };

    res.json({ user: userOut, token });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "No token provided" });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [idStr] = decoded.split(":");
    const userId = parseInt(idStr, 10);

    if (isNaN(userId)) throw new Error("Invalid token");

    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const user = users[0];
    if (!user) return res.status(401).json({ error: "unauthorized", message: "User not found" });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    });
  } catch {
    res.status(401).json({ error: "unauthorized", message: "Invalid token" });
  }
});

export default router;
