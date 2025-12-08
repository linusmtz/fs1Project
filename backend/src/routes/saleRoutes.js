import { Router } from "express";
import { createSale, getSales, exportSales } from "../controllers/saleController.js";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import { validateSale } from "../middlewares/validation.js";

const router = Router();

router.post("/", authMiddleware, validateSale, createSale);  
router.get("/", authMiddleware, getSales);
router.get("/export", authMiddleware, requireRole("admin"), exportSales);

export default router;
