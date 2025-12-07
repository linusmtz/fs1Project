import { Router } from "express";
import {
	createProduct,
	getProducts,
	getProductById,
	updateProduct,
	deleteProduct
} from "../controllers/productController.js";

import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();


// ALL
router.get("/", getProducts);
router.get("/:id", getProductById);

//  ADMIN:
router.post("/", authMiddleware, requireRole("admin"), createProduct);
router.put("/:id", authMiddleware, requireRole("admin"), updateProduct);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteProduct);

export default router;

