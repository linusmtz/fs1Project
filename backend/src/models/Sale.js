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
			quantity: { type: Number, required: true, min: 1 },
			price: { type: Number, required: true } 
		}
	],
	total: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model("Sale", saleSchema);

