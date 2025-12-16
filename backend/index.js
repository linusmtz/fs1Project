import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config()

const PORT = process.env.PORT || 3000;
connectDB();

// Escuchar solo en localhost (127.0.0.1) - Nginx hará el proxy
// NO usar 0.0.0.0 para no exponer Express directamente a Internet
app.listen(PORT, '127.0.0.1', () => 
	console.log(`Server running on localhost:${PORT}`)
);
