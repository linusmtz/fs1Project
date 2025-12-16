import { body, param, validationResult } from "express-validator";


export const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			message: "Error de validación",
			errors: errors.array().map((e) => e.msg),
		});
	}
	next();
};


export const validateUser = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("El nombre es requerido")
		.isLength({ min: 2, max: 100 })
		.withMessage("El nombre debe tener entre 2 y 100 caracteres"),
	body("email")
		.trim()
		.notEmpty()
		.withMessage("El email es requerido")
		.isEmail()
		.withMessage("El email no es válido")
		.normalizeEmail(),
	body("password")
		.notEmpty()
		.withMessage("La contraseña es requerida")
		.isLength({ min: 8 })
		.withMessage("La contraseña debe tener al menos 8 caracteres")
		.custom((value) => {
			// Validar que tenga al menos una mayúscula
			if (!/[A-Z]/.test(value)) {
				throw new Error("La contraseña debe contener al menos una letra mayúscula");
			}
			// Validar que tenga al menos una minúscula
			if (!/[a-z]/.test(value)) {
				throw new Error("La contraseña debe contener al menos una letra minúscula");
			}
			// Validar que tenga al menos un número
			if (!/[0-9]/.test(value)) {
				throw new Error("La contraseña debe contener al menos un número");
			}
			return true;
		}),
	body("role")
		.optional()
		.isIn(["admin", "vendedor"])
		.withMessage("El rol debe ser 'admin' o 'vendedor'"),
	validate,
];


export const validateLogin = [
	body("email")
		.trim()
		.notEmpty()
		.withMessage("El email es requerido")
		.isEmail()
		.withMessage("El email no es válido")
		.normalizeEmail(),
	body("password")
		.notEmpty()
		.withMessage("La contraseña es requerida"),
	validate,
];

// Validaciones para productos
export const validateProduct = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("El nombre del producto es requerido")
		.isLength({ min: 2, max: 200 })
		.withMessage("El nombre debe tener entre 2 y 200 caracteres"),
	body("category")
		.trim()
		.notEmpty()
		.withMessage("La categoría es requerida")
		.isLength({ min: 2, max: 100 })
		.withMessage("La categoría debe tener entre 2 y 100 caracteres"),
	body("price")
		.notEmpty()
		.withMessage("El precio es requerido")
		.isFloat({ min: 0 })
		.withMessage("El precio debe ser un número positivo"),
	body("stock")
		.notEmpty()
		.withMessage("El stock es requerido")
		.isInt({ min: 0 })
		.withMessage("El stock debe ser un número entero positivo o cero"),
	body("description")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("La descripción no puede exceder 1000 caracteres"),
	body("imageUrl")
		.optional()
		.trim()
		.isURL()
		.withMessage("La URL de imagen no es válida"),
	validate,
];


export const validateSale = [
	body("items")
		.isArray({ min: 1 })
		.withMessage("Debe incluir al menos un producto"),
	body("items.*.product")
		.notEmpty()
		.withMessage("El ID del producto es requerido")
		.isMongoId()
		.withMessage("El ID del producto no es válido"),
	body("items.*.quantity")
		.notEmpty()
		.withMessage("La cantidad es requerida")
		.isInt({ min: 1 })
		.withMessage("La cantidad debe ser un número entero positivo"),
	validate,
];


export const validateMongoId = [
	param("id")
		.notEmpty()
		.withMessage("El ID es requerido")
		.isMongoId()
		.withMessage("El ID no es válido"),
	validate,
];

