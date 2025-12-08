import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Security middleware
app.use(helmet());

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

// Error handler 
app.use(errorHandler);

export default app;
