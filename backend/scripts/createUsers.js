// Script para crear usuarios de prueba
// Uso: node scripts/createUsers.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, unique: true, required: true },
	password: { type: String, required: true },
	role: { type: String, enum: ["admin", "vendedor"], default: "vendedor" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function createUsers() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("✅ Conectado a MongoDB");

		// Hash de contraseñas
		const adminPassword = await bcrypt.hash("admin123", 10);
		const vendedorPassword = await bcrypt.hash("vendedor123", 10);

		// Crear o actualizar usuarios
		const admin = await User.findOneAndUpdate(
			{ email: "admin@test.com" },
			{
				name: "Administrador",
				email: "admin@test.com",
				password: adminPassword,
				role: "admin"
			},
			{ upsert: true, new: true }
		);

		const vendedor = await User.findOneAndUpdate(
			{ email: "vendedor@test.com" },
			{
				name: "Vendedor",
				email: "vendedor@test.com",
				password: vendedorPassword,
				role: "vendedor"
			},
			{ upsert: true, new: true }
		);

		console.log("\n✅ Usuarios creados/actualizados:");
		console.log("\n📧 Administrador:");
		console.log("   Email: admin@test.com");
		console.log("   Password: admin123");
		console.log("   Role: admin");
		
		console.log("\n📧 Vendedor:");
		console.log("   Email: vendedor@test.com");
		console.log("   Password: vendedor123");
		console.log("   Role: vendedor");

		await mongoose.connection.close();
		console.log("\n✅ Proceso completado");
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

createUsers();

