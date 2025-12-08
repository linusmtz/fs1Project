import User from "../models/User.js";
import { logAuditEvent } from "../utils/auditLogger.js";

const sanitizeUser = (user) => {
	const obj = user.toObject();
	delete obj.password;
	return obj;
};

export const createUser = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;

		const exists = await User.findOne({ email });
		if (exists) return res.status(400).json({ message: "Email ya existe" });

		const user = await User.create({ name, email, password, role });

		await logAuditEvent({
			action: "USER_CREATED",
			entityType: "user",
			entityId: user._id.toString(),
			entityName: user.name,
			performedBy: req.user?.id,
			details: `Se creó la cuenta ${user.email}`,
			metadata: { role: user.role }
		});

		res.status(201).json(sanitizeUser(user));
	} catch (err) {
		return res.status(400).json({
			message: "Error creando usuario",
			error: err.message
		});
	}
};

export const getUsers = async (_req, res, next) => {
	try {
		const users = await User.find().sort({ createdAt: -1 }).select("-password");
		res.json(users);
	} catch (error) {
		next(error);
	}
};

export const updateUser = async (req, res, next) => {
	try {
		const { name, email, role, password } = req.body;
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

		if (email && email !== user.email) {
			const exists = await User.findOne({ email });
			if (exists && exists._id.toString() !== user._id.toString()) {
				return res.status(400).json({ message: "El email ya está en uso" });
			}
			user.email = email;
		}

		if (name !== undefined) user.name = name;
		if (role !== undefined) user.role = role;
		if (password) user.password = password;

		await user.save();

		await logAuditEvent({
			action: "USER_UPDATED",
			entityType: "user",
			entityId: user._id.toString(),
			entityName: user.name,
			performedBy: req.user?.id,
			details: "Se actualizó información del usuario",
			metadata: {
				updatedFields: Object.keys(req.body || {})
			}
		});

		res.json({
			message: "Usuario actualizado",
			user: sanitizeUser(user)
		});
	} catch (error) {
		next(error);
	}
};

export const toggleUserStatus = async (req, res, next) => {
	try {
		const { active } = req.body;
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

		user.active = active;
		await user.save({ validateModifiedOnly: true });

		await logAuditEvent({
			action: "USER_STATUS_CHANGED",
			entityType: "user",
			entityId: user._id.toString(),
			entityName: user.name,
			performedBy: req.user?.id,
			details: `El usuario fue ${active ? "activado" : "desactivado"}`,
			metadata: { active }
		});

		res.json({
			message: `Usuario ${active ? "activado" : "desactivado"}`,
			user: sanitizeUser(user)
		});
	} catch (error) {
		next(error);
	}
};
