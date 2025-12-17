import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { logAuditEvent } from "../utils/auditLogger.js";

export const createSale = async (req, res, next) => {
	try {
		const { items } = req.body;

		if (!items || items.length === 0)
			return res.status(400).json({ message: "No se enviaron productos" });

		let total = 0;
		const saleItems = [];
		const productsData = []; // Para usar en auditoría

		for (const item of items) {
			const product = await Product.findById(item.product);

			if (!product) {
				return res.status(404).json({ message: `Producto no encontrado: ${item.product}` });
			}

			if (product.stock < item.quantity) {
				return res.status(400).json({ message: `Stock insuficiente para ${product.name}` });
			}

			product.stock -= item.quantity;
			await product.save();

			const subtotal = product.price * item.quantity;
			total += subtotal;

			saleItems.push({
				product: product._id,
				productName: product.name, // Guardar nombre del producto
				productCategory: product.category, // Guardar categoría del producto
				quantity: item.quantity,
				price: product.price
			});
			
			// Guardar datos del producto para auditoría
			productsData.push({
				_id: product._id,
				name: product.name
			});
		}

		const sale = await Sale.create({
			user: req.user.id,
			items: saleItems,
			total
		});

		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] Sale created - ID: ${sale._id}, Total: $${total.toFixed(2)}, Items: ${saleItems.length}, User: ${req.user.id}`);

		// Registrar auditoría
		const productNames = productsData.map(p => p.name).join(", ");
		
		await logAuditEvent({
			action: "SALE_CREATED",
			entityType: "sale",
			entityId: sale._id.toString(),
			entityName: `Venta #${sale._id.toString().slice(-6)}`,
			performedBy: req.user.id,
			details: `Venta registrada con ${saleItems.length} producto(s): ${productNames}`,
			metadata: {
				total: sale.total,
				itemsCount: saleItems.length
			}
		});

		res.status(201).json(sale);

	} catch (error) {
		next(error);
	}
};

export const getSales = async (req, res, next) => {
	try {
		const sales = await Sale.find()
			.sort({ createdAt: -1 })
			.populate("user", "name email")
			.populate("items.product", "name category price");

		// Asegurar que los items tengan datos incluso si el producto fue eliminado
		const salesWithFallback = sales.map(sale => ({
			...sale.toObject(),
			items: sale.items.map(item => ({
				...item,
				product: item.product || null, // Product puede ser null si fue eliminado
				// Usar datos denormalizados si el producto fue eliminado
				productName: item.productName || (item.product?.name || "Producto eliminado"),
				productCategory: item.productCategory || (item.product?.category || "N/A"),
			}))
		}));

		res.json(salesWithFallback);

	} catch (error) {
		next(error);
	}
};

export const exportSalesCSV = async (req, res, next) => {
	try {
		const sales = await Sale.find()
			.sort({ createdAt: -1 })
			.populate("user", "name email")
			.populate("items.product", "name category price");

		// Crear CSV
		const headers = [
			"Fecha",
			"Usuario",
			"Email",
			"Producto",
			"Categoría",
			"Cantidad",
			"Precio Unitario",
			"Subtotal",
			"Total Venta"
		];

		const rows = [];

		sales.forEach((sale) => {
			const saleDate = new Date(sale.createdAt).toLocaleString("es-MX", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit"
			});

			const userName = sale.user?.name || "N/A";
			const userEmail = sale.user?.email || "N/A";

			if (sale.items && sale.items.length > 0) {
				sale.items.forEach((item, index) => {
					// Usar datos denormalizados si el producto fue eliminado
					const productName = item.productName || item.product?.name || "Producto eliminado";
					const category = item.productCategory || item.product?.category || "N/A";
					const quantity = item.quantity || 0;
					const price = item.price || 0;
					const subtotal = quantity * price;

					// Solo mostrar el total de la venta en la primera fila de cada venta
					const totalVenta = index === 0 ? sale.total.toFixed(2) : "";

					rows.push([
						index === 0 ? saleDate : "", // Fecha solo en primera fila
						index === 0 ? userName : "", // Usuario solo en primera fila
						index === 0 ? userEmail : "", // Email solo en primera fila
						productName,
						category,
						quantity.toString(),
						price.toFixed(2),
						subtotal.toFixed(2),
						totalVenta
					]);
				});
			} else {
				// Venta sin items
				rows.push([
					saleDate,
					userName,
					userEmail,
					"N/A",
					"N/A",
					"0",
					"0.00",
					"0.00",
					sale.total.toFixed(2)
				]);
			}
		});

		// Convertir a CSV
		const csvContent = [
			headers.join(","),
			...rows.map(row => 
				row.map(cell => {
					// Escapar comillas y envolver en comillas si contiene comas o comillas
					const cellStr = String(cell);
					if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
						return `"${cellStr.replace(/"/g, '""')}"`;
					}
					return cellStr;
				}).join(",")
			)
		].join("\n");

		// Agregar BOM para Excel (UTF-8)
		const BOM = "\uFEFF";
		const csvWithBOM = BOM + csvContent;

		// Configurar headers para descarga
		res.setHeader("Content-Type", "text/csv; charset=utf-8");
		res.setHeader("Content-Disposition", `attachment; filename="ventas-${new Date().toISOString().split("T")[0]}.csv"`);
		
		res.send(csvWithBOM);

	} catch (error) {
		next(error);
	}
};

