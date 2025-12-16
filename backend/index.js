import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Conectar a la base de datos
connectDB();

// Escuchar solo en localhost (127.0.0.1) - Nginx hará el proxy
// NO usar 0.0.0.0 para no exponer Express directamente a Internet
app.listen(PORT, '127.0.0.1', () => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] Server started successfully`);
	console.log(`[${timestamp}] Environment: ${NODE_ENV}`);
	console.log(`[${timestamp}] Port: ${PORT}`);
	console.log(`[${timestamp}] Node version: ${process.version}`);
});
