import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ratingsTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  const { productId, userId, stars, comment } = req.body;
  if (!productId || !userId || !stars) {
    return res.status(400).json({ error: "bad_request", message: "Missing required fields" });
  }
  if (stars < 1 || stars > 5) {
    return res.status(400).json({ error: "bad_request", message: "Stars must be between 1 and 5" });
  }
  const [rating] = await db.insert(ratingsTable).values({ productId, userId, stars, comment }).returning();
  res.status(201).json({ ...rating, createdAt: rating.createdAt.toISOString() });
});

export default router;
