import Product from "../models/Product.js";


// ADMIN only
export const createProduct = async (req, res) => {
	try {
		const product = await Product.create(req.body);
		res.status(201).json(product);
	} catch (error) {
		res.status(400).json({ message: "Error creando producto", error });
	}
};

// ALL
export const getProducts = async (req, res) => {
	try {
		const products = await Product.find();
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: "Error obteniendo productos" });
	}
};

// ALL
export const getProductById = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "No encontrado" });
		res.json(product);
	} catch (error) {
		res.status(500).json({ message: "Error obteniendo producto" });
	}
};

// ADMIN only
export const updateProduct = async (req, res) => {
	try {
		const product = await Product.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		if (!product) return res.status(404).json({ message: "No encontrado" });
		res.json(product);
	} catch (error) {
		res.status(400).json({ message: "Error actualizando producto", error });
	}
};

// ADMIN only
export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) return res.status(404).json({ message: "No encontrado" });
		res.json({ message: "Producto eliminado" });
	} catch (error) {
		res.status(500).json({ message: "Error eliminando producto" });
	}
};

