import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res, next) => {
	try {
		const { action, entityType, limit = 50 } = req.query;

		const query = {};
		if (action) query.action = action;
		if (entityType) query.entityType = entityType;

		const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));

		const logs = await AuditLog.find(query)
			.sort({ createdAt: -1 })
			.limit(parsedLimit)
			.populate("performedBy", "name email role");

		res.json(logs);
	} catch (error) {
		next(error);
	}
};
