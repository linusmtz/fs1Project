import { Router } from "express";
import { uploadImage } from "../services/s3Storage.js";
import { upload, handleUploadError } from "../middlewares/uploadMiddleware.js";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Ruta para subir imagen de producto (solo admin)
router.post(
	"/image",
	authMiddleware,
	requireRole("admin"),
	upload.single("image"),
	handleUploadError,
	async (req, res, next) => {
		try {
			if (!req.file) {
				return res.status(400).json({ message: "No se proporcionó ninguna imagen" });
			}

			const { buffer, originalname, mimetype } = req.file;
			const imageUrl = await uploadImage(buffer, originalname, mimetype);

			res.json({ imageUrl });
		} catch (error) {
			next(error);
		}
	}
);

export default router;

