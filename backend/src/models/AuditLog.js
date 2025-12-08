import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
	action: { type: String, required: true },
	entityType: { type: String, required: true },
	entityId: { type: String },
	entityName: { type: String },
	performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	details: { type: String },
	metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
