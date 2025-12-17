import User from "../models/User.js";
import { logAuditEvent } from "../utils/auditLogger.js";

export const getUsers = async (req, res, next) => {
	try {
		const users = await User.find({}).select("-password").sort({ createdAt: -1 });
		res.json(users);
	} catch (err) {
		next(err);
	}
};

export const createUser = async (req, res, next) => {
	try {
		const { name, email, password, role } = req.body;

		const exists = await User.findOne({ email });
		if (exists) {
			return res.status(400).json({ message: "Email ya existe" });
		}

		const user = await User.create({ name, email, password, role });

		// Registrar auditoría
		await logAuditEvent({
			action: "USER_CREATED",
			entityType: "user",
			entityId: user._id.toString(),
			entityName: user.name,
			performedBy: req.user.id,
			details: `Usuario "${user.name}" creado con rol "${user.role}"`,
			metadata: {
				email: user.email,
				role: user.role
			}
		});

		// No devolver la contraseña
		const userResponse = user.toObject();
		delete userResponse.password;

		res.status(201).json(userResponse);
	} catch (err) {
		next(err);
	}
};

export const updateUserRole = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		if (!["admin", "vendedor"].includes(role)) {
			return res.status(400).json({ message: "El rol debe ser 'admin' o 'vendedor'" });
		}

		const oldUser = await User.findById(id).select("role");
		if (!oldUser) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		const user = await User.findByIdAndUpdate(
			id,
			{ role },
			{ new: true, runValidators: true }
		).select("-password");

		// Registrar auditoría
		await logAuditEvent({
			action: "USER_UPDATED",
			entityType: "user",
			entityId: user._id.toString(),
			entityName: user.name,
			performedBy: req.user.id,
			details: `Rol de usuario "${user.name}" actualizado de "${oldUser.role}" a "${user.role}"`,
			metadata: {
				oldRole: oldUser.role,
				newRole: user.role
			}
		});

		res.json(user);
	} catch (err) {
		next(err);
	}
};

export const toggleUserStatus = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { active } = req.body;

		if (typeof active !== "boolean") {
			return res.status(400).json({ message: "El campo 'active' debe ser un booleano" });
		}

		const user = await User.findByIdAndUpdate(
			id,
			{ active },
			{ new: true, runValidators: true }
		).select("-password");

		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		// Registrar auditoría
		await logAuditEvent({
			action: "USER_STATUS_CHANGED",
			entityType: "user",
			entityId: user._id.toString(),
			entityName: user.name,
			performedBy: req.user.id,
			details: `Estado de usuario "${user.name}" ${active ? "activado" : "desactivado"}`,
			metadata: {
				active: user.active
			}
		});

		res.json(user);
	} catch (err) {
		next(err);
	}
};

export const deleteUser = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Verificar que el usuario existe
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		// No permitir auto-eliminación
		if (id === req.user.id) {
			return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
		}

		// Guardar información para auditoría antes de eliminar
		const userInfo = {
			id: user._id.toString(),
			name: user.name,
			email: user.email,
			role: user.role
		};

		// Eliminar usuario
		await User.findByIdAndDelete(id);

		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] User deleted - ID: ${userInfo.id}, Name: ${userInfo.name}, Email: ${userInfo.email}, Deleted by: ${req.user.id}`);

		// Registrar auditoría
		await logAuditEvent({
			action: "USER_DELETED",
			entityType: "user",
			entityId: userInfo.id,
			entityName: userInfo.name,
			performedBy: req.user.id,
			details: `Usuario "${userInfo.name}" (${userInfo.email}) eliminado del sistema`,
			metadata: {
				email: userInfo.email,
				role: userInfo.role
			}
		});

		res.json({ message: "Usuario eliminado correctamente" });
	} catch (err) {
		next(err);
	}
};

