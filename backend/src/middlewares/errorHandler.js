export const errorHandler = (err, req, res, next) => {
	// Log del error para monitoreo
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] ERROR:`, {
		message: err.message,
		stack: err.stack,
		method: req?.method,
		url: req?.originalUrl || req?.url,
		ip: req?.ip || req?.connection?.remoteAddress,
		userId: req?.user?.id || 'anonymous'
	});

	// Error de validación de Mongoose
	if (err.name === "ValidationError") {
		const errors = Object.values(err.errors).map((e) => e.message);
		return res.status(400).json({
			message: "Error de validación",
			errors,
		});
	}

	// Error de duplicado (email único, etc)
	if (err.code === 11000) {
		const field = Object.keys(err.keyPattern)[0];
		return res.status(400).json({
			message: `${field} ya existe`,
		});
	}

	// Error de JWT
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({
			message: "Token inválido",
		});
	}

	if (err.name === "TokenExpiredError") {
		return res.status(401).json({
			message: "Token expirado",
		});
	}

	// Error de validación de express-validator
	if (err.array && typeof err.array === "function") {
		return res.status(400).json({
			message: "Error de validación",
			errors: err.array().map((e) => e.msg),
		});
	}

	// Error por defecto
	res.status(err.status || 500).json({
		message: err.message || "Error interno del servidor",
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	});
};

