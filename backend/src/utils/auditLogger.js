import AuditLog from "../models/AuditLog.js";

export const logAuditEvent = async ({
	action,
	entityType,
	entityId,
	entityName,
	performedBy,
	details,
	metadata
}) => {
	try {
		await AuditLog.create({
			action,
			entityType,
			entityId,
			entityName,
			performedBy,
			details,
			metadata
		});
	} catch (error) {
		console.error("Error registrando auditoría:", error.message);
	}
};
