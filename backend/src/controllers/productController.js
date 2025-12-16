import Product from "../models/Product.js";
import { uploadImage, deleteImage } from "../services/s3Storage.js";
import { logAuditEvent } from "../utils/auditLogger.js";


// ADMIN only
export const createProduct = async (req, res, next) => {
	try {
		const productData = { ...req.body };
		
		// Si hay una imagen en el body (URL ya subida desde el frontend)
		// o si viene un file directamente (por si acaso)
		// Por ahora asumimos que la imagen ya viene como URL en req.body.imageUrl
		// porque el frontend la subirá primero
		
		const product = await Product.create(productData);
		
		// Registrar auditoría
		await logAuditEvent({
			action: "PRODUCT_CREATED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user.id,
			details: `Producto "${product.name}" creado en la categoría "${product.category}"`,
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

		const updateData = { ...req.body };
		
		// Si se está actualizando la imagen y había una anterior, eliminar la anterior
		if (updateData.imageUrl) {
			const oldProduct = await Product.findById(req.params.id);
			if (oldProduct && oldProduct.imageUrl && oldProduct.imageUrl !== updateData.imageUrl) {
				// Solo eliminar si la URL es diferente y es del bucket de OCI
				if (oldProduct.imageUrl.includes(process.env.AWS_S3_ENDPOINT_URL)) {
					try {
						await deleteImage(oldProduct.imageUrl);
					} catch (err) {
						console.error("Error al eliminar imagen anterior:", err);
						// Continuar aunque falle la eliminación
					}
				}
			}
		}

		const oldProduct = await Product.findById(req.params.id);
		if (!oldProduct) return res.status(404).json({ message: "Producto no encontrado" });
		
		const product = await Product.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true, runValidators: true }
		);
		
		// Registrar auditoría
		await logAuditEvent({
			action: "PRODUCT_UPDATED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user.id,
			details: `Producto "${product.name}" actualizado`,
			metadata: {
				oldPrice: oldProduct.price,
				newPrice: product.price,
				oldStock: oldProduct.stock,
				newStock: product.stock
			}
		});
		
		res.json(product);
	} catch (error) {
		next(error);
	}
};

// ADMIN only
export const deleteProduct = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Producto no encontrado" });
		
		// Eliminar imagen del bucket si existe
		if (product.imageUrl && product.imageUrl.includes(process.env.AWS_S3_ENDPOINT_URL)) {
			try {
				await deleteImage(product.imageUrl);
			} catch (err) {
				console.error("Error al eliminar imagen:", err);
				// Continuar aunque falle la eliminación
			}
		}
		
		// Registrar auditoría antes de eliminar
		await logAuditEvent({
			action: "PRODUCT_DELETED",
			entityType: "product",
			entityId: product._id.toString(),
			entityName: product.name,
			performedBy: req.user.id,
			details: `Producto "${product.name}" eliminado`,
			metadata: {
				category: product.category,
				price: product.price,
				stock: product.stock
			}
		});
		
		await Product.findByIdAndDelete(req.params.id);
		res.json({ message: "Producto eliminado exitosamente" });
	} catch (error) {
		next(error);
	}
};

