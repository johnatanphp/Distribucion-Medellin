import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storesRouter from "./stores";
import productsRouter from "./products";
import usersRouter from "./users";
import ratingsRouter from "./ratings";
import statsRouter from "./stats";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/stores", storesRouter);
router.use("/products", productsRouter);
router.use("/users", usersRouter);
router.use("/ratings", ratingsRouter);
router.use("/stats", statsRouter);
router.use("/orders", ordersRouter);

export default router;
