import { Router } from "express";
import { createSale, getSales } from "../controllers/saleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, createSale);  
router.get("/", authMiddleware, getSales);

export default router;

