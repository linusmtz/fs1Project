import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

		const isMatch = await user.comparePassword(password);
		if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

		const token = jwt.sign(
			{
				id: user._id,
				role: user.role
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		return res.json({
			message: "Login exitoso",
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role
			}
		});

	} catch (err) {
		res.status(500).json({ message: "Error en login", err });
	}
};

