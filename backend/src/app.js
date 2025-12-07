import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js" 
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
	res.json({ status: "OK" });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);


export default app;
