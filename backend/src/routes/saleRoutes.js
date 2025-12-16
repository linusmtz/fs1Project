import { Router } from "express";
import { createSale, getSales } from "../controllers/saleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateSale } from "../middlewares/validation.js";

const router = Router();

router.post("/", authMiddleware, validateSale, createSale);  
router.get("/", authMiddleware, getSales);

export default router;

