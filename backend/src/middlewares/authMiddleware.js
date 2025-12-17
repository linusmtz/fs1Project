import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1];

	if (!token)
		return res.status(401).json({ message: "Token no proporcionado" });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // id, role, etc.
			next();
	} catch (error) {
		return res.status(401).json({ message: "Token inválido" });
	}
};

export const requireRole = (...roles) => {
	return (req, res, next) => {
		// Verificar que el usuario esté autenticado primero
		if (!req.user) {
			return res.status(401).json({ message: "No autenticado" });
		}
		
		// Verificar que tenga el rol requerido
		if (!roles.includes(req.user.role)) {
			return res
				.status(403)
				.json({ message: "No tienes permisos para realizar esta acción" });
		}
		next();
	};
};

