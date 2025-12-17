import { Router } from "express";
import { getUsers, createUser, updateUserRole, toggleUserStatus, deleteUser } from "../controllers/userController.js";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import { validateUser, validateMongoId } from "../middlewares/validation.js";

const router = Router();

// ADMIN - Obtener todos los usuarios
router.get("/", authMiddleware, requireRole("admin"), getUsers);

// ADMIN - Crear usuario
router.post("/", authMiddleware, requireRole("admin"), validateUser, createUser);

// ADMIN - Actualizar rol de usuario
router.put("/:id", authMiddleware, requireRole("admin"), validateMongoId, updateUserRole);

// ADMIN - Activar/Desactivar usuario
router.patch("/:id/status", authMiddleware, requireRole("admin"), validateMongoId, toggleUserStatus);

// ADMIN - Eliminar usuario
router.delete("/:id", authMiddleware, requireRole("admin"), validateMongoId, deleteUser);

export default router;

