import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/userRoutes.js" 
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Trust proxy - Necesario cuando la app está detrás de un proxy 
// Esto permite que Express confíe en los headers X-Forwarded-* del proxy
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// Middleware básico de logging para monitoreo (después de helmet)
app.use((req, res, next) => {
	const start = Date.now();
	const timestamp = new Date().toISOString();
	
	res.on('finish', () => {
		const duration = Date.now() - start;
		const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - IP: ${req.ip || req.connection.remoteAddress}`;
		
		if (res.statusCode >= 400) {
			console.error(logMessage);
		} else {
			console.log(logMessage);
		}
	});
	
	next();
});

// CORS configurado
app.use(cors({
	origin: process.env.FRONTEND_URL || "http://localhost:5173",
	credentials: true
}));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 100, // máximo 100 requests por ventana
	message: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde"
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 5, // máximo 5 intentos de login
	message: "Demasiados intentos de login, intenta de nuevo más tarde"
});

app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitización de datos MongoDB 
const sanitizeRequest = (req, res, next) => {
	["body", "params", "headers", "query"].forEach((key) => {
		if (req[key]) {
			mongoSanitize.sanitize(req[key]);
		}
	});
	next();
};
app.use(sanitizeRequest);

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/upload", uploadRoutes);

// Error handler 
app.use(errorHandler);

export default app;
