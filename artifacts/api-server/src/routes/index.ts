import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storesRouter from "./stores";
import productsRouter from "./products";
import usersRouter from "./users";
import ratingsRouter from "./ratings";
import statsRouter from "./stats";
import ordersRouter from "./orders";
import branchesRouter from "./branches";
import documentsRouter from "./documents";
import settingsRouter from "./settings";
import notificationsRouter from "./notifications";
import whatsappRouter from "./whatsapp";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/stores", storesRouter);
router.use("/products", productsRouter);
router.use("/users", usersRouter);
router.use("/ratings", ratingsRouter);
router.use("/stats", statsRouter);
router.use("/orders", ordersRouter);
router.use("/branches", branchesRouter);
router.use("/documents", documentsRouter);
router.use("/settings", settingsRouter);
router.use("/notifications", notificationsRouter);
router.use("/whatsapp", whatsappRouter);

export default router;
