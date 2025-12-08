import Product from "../models/Product.js";
import { logAuditEvent } from "../utils/auditLogger.js";


// ADMIN only
export const createProduct = async (req, res, next) => {
	try {
		const product = await Product.create(req.body);
		await logAuditEvent({
			action: "PRODUCT_CREATED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user?.id,
			details: `Se creó el producto ${product.name}`,
			metadata: {
				price: product.price,
				stock: product.stock,
				category: product.category
			}
		});
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
		await logAuditEvent({
			action: "PRODUCT_UPDATED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user?.id,
			details: "Se actualizaron datos del producto",
			metadata: { changes: req.body }
		});
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
		await logAuditEvent({
			action: "PRODUCT_DELETED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user?.id,
			details: "Se eliminó un producto del catálogo"
		});
		res.json({ message: "Producto eliminado exitosamente" });
	} catch (error) {
		next(error);
	}
};

// ADMIN only
export const restockProduct = async (req, res, next) => {
	try {
		const { quantity } = req.body;
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Producto no encontrado" });

		product.stock += quantity;
		await product.save();

		await logAuditEvent({
			action: "PRODUCT_RESTOCKED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user?.id,
			details: `Se añadieron ${quantity} unidades al inventario`,
			metadata: { quantity, stock: product.stock }
		});
		res.json({
			message: "Inventario actualizado",
			product
		});
	} catch (error) {
		next(error);
	}
};
