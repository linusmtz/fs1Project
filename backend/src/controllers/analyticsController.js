import Product from "../models/Product.js";
import Sale from "../models/Sale.js";

export const getSummary = async (req, res, next) => {
	try {
		const [productStats] = await Product.aggregate([
			{
				$group: {
					_id: null,
					totalProducts: { $sum: 1 },
					totalInventoryUnits: { $sum: "$stock" },
					inventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
					lowStockItems: {
						$sum: {
							$cond: [{ $lte: ["$stock", 5] }, 1, 0]
						}
					}
				}
			}
		]);

		const [salesStats] = await Sale.aggregate([
			{
				$group: {
					_id: null,
					totalRevenue: { $sum: "$total" },
					totalSales: { $sum: 1 }
				}
			}
		]);

		const bestSellers = await Sale.aggregate([
			{ $unwind: "$items" },
			{
				$group: {
					_id: "$items.product",
					quantity: { $sum: "$items.quantity" },
					revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
				}
			},
			{ $sort: { quantity: -1 } },
			{ $limit: 5 },
			{
				$lookup: {
					from: "products",
					localField: "_id",
					foreignField: "_id",
					as: "product"
				}
			},
			{ $unwind: "$product" },
			{
				$project: {
					_id: 0,
					productId: "$product._id",
					name: "$product.name",
					category: "$product.category",
					quantity: 1,
					revenue: 1
				}
			}
		]);

		const recentSales = await Sale.find()
			.sort({ createdAt: -1 })
			.limit(5)
			.populate("user", "name email")
			.populate("items.product", "name category price");

		const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
			.sort({ stock: 1 })
			.limit(5)
			.select("name category stock");

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 6);
		startDate.setHours(0, 0, 0, 0);

		const salesTrendRaw = await Sale.aggregate([
			{
				$match: {
					createdAt: { $gte: startDate }
				}
			},
			{
				$group: {
					_id: {
						year: { $year: "$createdAt" },
						month: { $month: "$createdAt" },
						day: { $dayOfMonth: "$createdAt" }
					},
					totalRevenue: { $sum: "$total" },
					totalSales: { $sum: 1 }
				}
			},
			{ $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
		]);

		const salesTrend = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
			const match = salesTrendRaw.find(
				(item) =>
					item._id.year === date.getFullYear() &&
					item._id.month === date.getMonth() + 1 &&
					item._id.day === date.getDate()
			);
			salesTrend.push({
				date: key,
				totalRevenue: match?.totalRevenue || 0,
				totalSales: match?.totalSales || 0
			});
		}

		res.json({
			products: {
				total: productStats?.totalProducts || 0,
				totalInventoryUnits: productStats?.totalInventoryUnits || 0,
				inventoryValue: productStats?.inventoryValue || 0,
				lowStockItems: productStats?.lowStockItems || 0,
				lowStockProducts
			},
			sales: {
				totalRevenue: salesStats?.totalRevenue || 0,
				totalSales: salesStats?.totalSales || 0,
				bestSellers,
				recentSales,
				trend: salesTrend
			}
		});
	} catch (error) {
		next(error);
	}
};
