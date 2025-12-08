import { Router } from "express";
import {
	createUser,
	getUsers,
	updateUser,
	toggleUserStatus
} from "../controllers/userController.js";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import {
	validateUser,
	validateUserUpdate,
	validateMongoId,
	validateUserStatus
} from "../middlewares/validation.js";

const router = Router();

// ADMIN
router.post("/", authMiddleware, requireRole("admin"), validateUser, createUser);
router.get("/", authMiddleware, requireRole("admin"), getUsers);
router.put("/:id", authMiddleware, requireRole("admin"), validateMongoId, validateUserUpdate, updateUser);
router.patch("/:id/status", authMiddleware, requireRole("admin"), validateMongoId, validateUserStatus, toggleUserStatus);

export default router;
