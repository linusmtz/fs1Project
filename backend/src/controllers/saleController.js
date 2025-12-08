import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { logAuditEvent } from "../utils/auditLogger.js";

export const createSale = async (req, res) => {
	try {
		const { items } = req.body;

		if (!items || items.length === 0)
			return res.status(400).json({ message: "No se enviaron productos" });

		let total = 0;
		const saleItems = [];

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
				quantity: item.quantity,
				price: product.price
			});
		}

		const sale = await Sale.create({
			user: req.user.id,
			items: saleItems,
			total
		});

		await logAuditEvent({
			action: "SALE_CREATED",
			entityType: "sale",
			entityId: sale._id.toString(),
			performedBy: req.user?.id,
			details: `Se registró una venta por $${total.toFixed(2)}`,
			metadata: {
				total,
				items: saleItems.length
			}
		});

		res.status(201).json(sale);

	} catch (error) {
		res.status(500).json({ message: "Error creando venta", error: error.message });
	}
};

export const getSales = async (req, res, next) => {
	try {
		const sales = await Sale.find()
			.sort({ createdAt: -1 })
			.populate("user", "name email")
			.populate("items.product", "name category price");

		res.json(sales);

	} catch (error) {
		next(error);
	}
};

export const exportSales = async (req, res, next) => {
	try {
		const sales = await Sale.find()
			.sort({ createdAt: -1 })
			.populate("user", "name email")
			.populate("items.product", "name category price");

		const headers = ["Venta", "Fecha", "Usuario", "Email", "Total", "Productos"];
		const escapeValue = (value) => {
			if (value === null || value === undefined) return "";
			const str = value.toString().replace(/"/g, '""');
			return `"${str}"`;
		};

		const rows = sales.map((sale) => {
			const itemsText = sale.items
				.map((item) => {
					const productName = item.product?.name || "Producto";
					return `${productName} (${item.quantity})`;
				})
				.join(" | ");
			return [
				sale._id.toString(),
				new Date(sale.createdAt).toISOString(),
				sale.user?.name || "Usuario",
				sale.user?.email || "",
				sale.total.toFixed(2),
				itemsText
			]
				.map(escapeValue)
				.join(",");
		});

		const csvContent = [headers.join(","), ...rows].join("\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename="sales-${Date.now()}.csv"`);
		return res.send(csvContent);

	} catch (error) {
		next(error);
	}
};
