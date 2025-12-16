import { Router } from "express";
import {
	createProduct,
	getProducts,
	getProductById,
	updateProduct,
	deleteProduct
} from "../controllers/productController.js";

import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import { validateProduct, validateMongoId } from "../middlewares/validation.js";

const router = Router();


// ALL 
router.get("/", authMiddleware, getProducts);
router.get("/:id", authMiddleware, validateMongoId, getProductById);

//  ADMIN:
router.post("/", authMiddleware, requireRole("admin"), validateProduct, createProduct);
router.put("/:id", authMiddleware, requireRole("admin"), validateMongoId, validateProduct, updateProduct);
router.delete("/:id", authMiddleware, requireRole("admin"), validateMongoId, deleteProduct);

export default router;

