import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	items: [
		{
			product: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
				required: true
			},
			// Datos denormalizados del producto al momento de la venta
			// Esto preserva la información histórica aunque el producto sea eliminado
			productName: { type: String, required: false }, // No requerido para compatibilidad con ventas antiguas
			productCategory: { type: String, required: false }, // No requerido para compatibilidad con ventas antiguas
			quantity: { type: Number, required: true, min: 1 },
			price: { type: Number, required: true } 
		}
	],
	total: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model("Sale", saleSchema);

