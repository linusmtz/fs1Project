import { Router } from "express";
import { getAuditLogs } from "../controllers/auditController.js";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, requireRole("admin"), getAuditLogs);

export default router;
