import multer from "multer";

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
	// Permitir solo imágenes
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Solo se permiten archivos de imagen (jpg, png, webp, etc.)"), false);
	}
};

// Configurar multer
export const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB máximo
	},
	fileFilter: fileFilter,
});

// Middleware para manejar errores de multer
export const handleUploadError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({ message: "El archivo es demasiado grande. Máximo 5MB" });
		}
		return res.status(400).json({ message: err.message });
	}
	if (err) {
		return res.status(400).json({ message: err.message });
	}
	next();
};

