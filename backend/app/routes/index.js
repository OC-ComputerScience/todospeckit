import { Router } from "express";
import authRoutes from "./auth.routes.js";
import listRoutes from "./list.routes.js";
import todoRoutes from "./todo.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/lists", listRoutes);
router.use("/todos", todoRoutes);

export default router;
