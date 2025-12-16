import Product from "../models/Product.js";


// ADMIN only
export const createProduct = async (req, res, next) => {
	try {
		const product = await Product.create(req.body);
		res.status(201).json(product);
	} catch (error) {
		next(error);
	}
};

// ALL
export const getProducts = async (req, res, next) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 });
		res.json(products);
	} catch (error) {
		next(error);
	}
};

// ALL
export const getProductById = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Producto no encontrado" });
		res.json(product);
	} catch (error) {
		next(error);
	}
};

// ADMIN only
export const updateProduct = async (req, res, next) => {
	try {
		// Validar que el stock no sea negativo
		if (req.body.stock !== undefined && req.body.stock < 0) {
			return res.status(400).json({ message: "El stock no puede ser negativo" });
		}

		// Validar que el precio no sea negativo
		if (req.body.price !== undefined && req.body.price < 0) {
			return res.status(400).json({ message: "El precio no puede ser negativo" });
		}

		const product = await Product.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!product) return res.status(404).json({ message: "Producto no encontrado" });
		res.json(product);
	} catch (error) {
		next(error);
	}
};

// ADMIN only
export const deleteProduct = async (req, res, next) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) return res.status(404).json({ message: "Producto no encontrado" });
		res.json({ message: "Producto eliminado exitosamente" });
	} catch (error) {
		next(error);
	}
};

