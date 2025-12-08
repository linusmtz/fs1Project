import { Router } from "express";
import {
	createProduct,
	getProducts,
	getProductById,
	updateProduct,
	deleteProduct,
	restockProduct
} from "../controllers/productController.js";

import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import { validateProduct, validateMongoId, validateRestock } from "../middlewares/validation.js";

const router = Router();


// ALL 
router.get("/", authMiddleware, getProducts);
router.get("/:id", authMiddleware, validateMongoId, getProductById);

//  ADMIN:
router.post("/", authMiddleware, requireRole("admin"), validateProduct, createProduct);
router.put("/:id", authMiddleware, requireRole("admin"), validateMongoId, validateProduct, updateProduct);
router.delete("/:id", authMiddleware, requireRole("admin"), validateMongoId, deleteProduct);
router.patch("/:id/restock", authMiddleware, requireRole("admin"), validateMongoId, validateRestock, restockProduct);

export default router;
