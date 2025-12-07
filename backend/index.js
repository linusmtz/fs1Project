import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config()

const PORT = process.env.PORT || 3000;
connectDB();

app.listen(3000,() => 
	console.log(`Server running in port:${PORT}`)
);
