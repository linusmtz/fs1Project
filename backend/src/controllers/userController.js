import User from "../models/User.js";

export const createUser = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;

		const exists = await User.findOne({ email });
		if (exists) return res.status(400).json({ message: "Email ya existe" });

		const user = await User.create({ name, email, password, role });

		res.status(201).json(user);
	} catch (err) {
		return res.status(400).json({
			message: "Error creando usuario",
			error: err.message,
			stack: err.stack
		});
	}

};

