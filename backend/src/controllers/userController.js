import User from "../models/User.js";

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

		const user = await User.findByIdAndUpdate(
			id,
			{ role },
			{ new: true, runValidators: true }
		).select("-password");

		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

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

		res.json(user);
	} catch (err) {
		next(err);
	}
};

