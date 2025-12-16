
import mongoose from "mongoose";

export const connectDB = async () => {

	try {
		await mongoose.connect(process.env.MONGO_URI);
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] MongoDB connected successfully`);
		console.log(`[${timestamp}] Database: ${mongoose.connection.name}`);
		console.log(`[${timestamp}] Host: ${mongoose.connection.host}`);
	} catch (error) {
		const timestamp = new Date().toISOString();
		console.error(`[${timestamp}] MongoDB connection error:`, error.message);
		process.exit(1);
	}
};

