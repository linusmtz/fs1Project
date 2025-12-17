# ⚙️ Backend – FS1 Inventory & Sales Platform

API REST construida con **Node.js + Express + MongoDB** que expone las operaciones de autenticación, administración, inventario, ventas y auditoría.

## Índice

1. [Stack y dependencias](#stack-y-dependencias)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Variables de entorno](#variables-de-entorno)
4. [Scripts disponibles](#scripts-disponibles)
5. [Flujo de ejecución](#flujo-de-ejecución)
6. [Modelos y relaciones](#modelos-y-relaciones)
7. [Middlewares y validaciones](#middlewares-y-validaciones)
8. [Endpoints principales](#endpoints-principales)
9. [Auditoría](#auditoría)
10. [Despliegue y PM2](#despliegue-y-pm2)

## Stack y dependencias

- **Node.js 18+ / Express 5**
- **MongoDB + Mongoose 9**
- **JWT** para autenticación de usuarios.
- **bcryptjs** para hashing de contraseñas.
- **helmet**, **cors**, **express-rate-limit**, **express-mongo-sanitize** y **express-validator** para endurecer la API.
- **@aws-sdk/client-s3** para upload de imágenes a Oracle Cloud Object Storage.
- **multer** para manejo de archivos multipart/form-data.
- **dotenv** para manejar variables de entorno.
- **nodemon** (dev) y **PM2** (producción).

## Estructura de carpetas

```
backend/
├── index.js               # Punto de entrada (carga app y DB)
├── scripts/
│   └── createUsers.js     # Semilla de cuentas admin/vendedor
├── src/
│   ├── app.js             # Configuración Express + middlewares + logging
│   ├── config/
│   │   └── db.js          # Conexión MongoDB
│   ├── controllers/       # auth, user, product, sale, analytics, audit
│   ├── middlewares/       # authMiddleware, validation, errorHandler, uploadMiddleware
│   ├── models/            # User, Product, Sale, AuditLog
│   ├── routes/            # /auth, /users, /products, /sales, /analytics, /audit, /upload
│   ├── services/
│   │   └── s3Storage.js   # Servicio para Oracle Cloud Object Storage
│   └── utils/
│       └── auditLogger.js # Helper para registrar eventos
└── package.json
```

## Variables de entorno

Crear `backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fs1project
JWT_SECRET=super_secreto_123
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Oracle Cloud Object Storage (S3 Compatible) - Para upload de imágenes
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_STORAGE_BUCKET_NAME=nombre_del_bucket
AWS_S3_REGION_NAME=us-ashburn-1
AWS_S3_ENDPOINT_URL=https://tu-namespace.compat.objectstorage.region.oraclecloud.com
```

- `MONGO_URI`: puede apuntar a un cluster de Atlas.
- `FRONTEND_URL`: dominio/puerto permitido por CORS.
- Variables de Oracle Cloud: necesarias para habilitar el upload de imágenes de productos.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor con Nodemon. |
| `npm start`   | Ejecuta el servidor en modo producción local. |
| `npm run create-users` | Ejecuta `scripts/createUsers.js` para crear/actualizar usuarios seed (`admin@test.com`, `vendedor@test.com`). |

> El script de tests está como placeholder (`npm test`), puedes reemplazarlo con tu runner preferido.

## Flujo de ejecución

1. `index.js` carga variables `.env`, conecta la base de datos (`connectDB`) y levanta Express.
2. `src/app.js` agrega middleware de seguridad, rate limiting, sanitización y parsing.
3. El enrutamiento monta `/api/*` para cada módulo.
4. `errorHandler` captura errores y los normaliza en formato JSON.

## Modelos y relaciones

- **User**: nombre, email, password (hash), rol (`admin`, `vendedor`), `active`.
- **Product**: nombre, categoría, precio, stock, descripción, `imageUrl` (URL de Oracle Cloud).
- **Sale**: referencia a `user`, datos denormalizados del usuario (`userName`, `userEmail`), arreglo de ítems con:
  - `product`: referencia al producto (ObjectId)
  - `productName`: nombre del producto al momento de la venta (denormalizado)
  - `productCategory`: categoría del producto al momento de la venta (denormalizado)
  - `quantity`: cantidad vendida
  - `price`: precio al momento de la venta
  - `total`: suma total de la venta
- **AuditLog**: acción, tipo/ID/nombre de entidad, usuario que realizó la acción y metadatos (p. ej., cantidad restock).

> **Nota sobre denormalización en Sale**: 
> - Los campos `productName` y `productCategory` se guardan al momento de crear la venta para preservar la información histórica aunque el producto sea eliminado posteriormente.
> - Los campos `userName` y `userEmail` se guardan al momento de crear la venta y se actualizan automáticamente cuando un usuario es eliminado, preservando la información histórica aunque el usuario sea eliminado del sistema.

## Middlewares y validaciones

- `authMiddleware`: valida y decodifica el JWT (`Authorization: Bearer <token>`).
- `requireRole(...roles)`: permite continuar solo si el usuario tiene uno de los roles indicados.
- `validation.js`: expresiones con `express-validator` para entradas de usuarios, productos, ventas y Mongo IDs.
  - **Validación de contraseña**: mínimo 8 caracteres, debe contener mayúscula, minúscula y número.
  - **Validación de productos**: precio y stock no negativos.
  - **Validación de ventas**: items con productos válidos y cantidades positivas.
- `uploadMiddleware`: valida archivos de imagen (tipos permitidos, tamaño máximo 5MB).
- `errorHandler`: captura cualquier `throw` o `next(error)` y responde con 500/400 según corresponda.
- **Request logging**: middleware que registra todas las peticiones HTTP con timestamp, método, URL, status code, tiempo de respuesta e IP.

## Endpoints principales

| Método | Ruta                            | Descripción                                                   |
|--------|---------------------------------|---------------------------------------------------------------|
| `POST` | `/api/auth/login`               | Devuelve tokenJWT y datos del usuario (valida estado activo). |
| `GET`  | `/api/users` (admin)            | Lista usuarios sin el campo `password`.                       |
| `POST` | `/api/users` (admin)            | Crea usuario con rol `admin` o `vendedor`.                    |
| `PUT`  | `/api/users/:id` (admin)        | Actualiza nombre, email, rol o password.                      |
| `PATCH`| `/api/users/:id/status` (admin) | Activa/desactiva cuentas (sin revalidar password/email).      |
| `DELETE`| `/api/users/:id` (admin)     | Elimina usuario del sistema (no permite auto-eliminación). Denormaliza datos del usuario en todas sus ventas antes de eliminar.     |
| `GET`  | `/api/products`                 | Lista productos (autenticado).                                |
| `POST` | `/api/products` (admin)         | Crea producto con validaciones de precio/stock.               |
| `PUT`  | `/api/products/:id` (admin)     | Actualiza producto con `runValidators`.                       |
| `PATCH`| `/api/products/:id/restock` (admin) | Incrementa stock (`validateRestock`). |
| `DELETE`| `/api/products/:id` (admin)    | Elimina producto. |
| `GET`  | `/api/sales`                    | Listado con `populate` de usuario y productos. Maneja productos eliminados usando datos denormalizados. |
| `POST` | `/api/sales`                    | Crea venta, descuenta stock, guarda datos denormalizados del producto y registra auditoría. |
| `GET`  | `/api/sales/export` (admin)     | Exporta CSV con formato compatible con Excel (UTF-8 con BOM). |
| `POST` | `/api/upload/image` (admin)     | Sube imagen de producto a Oracle Cloud Object Storage. Retorna URL pública. |
| `GET`  | `/api/analytics/summary`        | Resumen usado por Dashboard. |
| `GET`  | `/api/audit` (admin)            | Timeline de auditoría (parámetros `action`, `entityType`, `limit`). |

## Auditoría

- `utils/auditLogger.js` crea entradas en `AuditLog` sin interrumpir el flujo principal (errores se loggean en consola).
- Acciones registradas: creación/actualización/eliminación de productos, creación/edición/estado de usuarios, registro de ventas.
- Cada registro incluye: acción (`PRODUCT_CREATED`, `USER_CREATED`, `SALE_CREATED`, etc.), entidad involucrada, usuario que ejecutó la acción y metadatos (por ejemplo `quantity`, `total`).
- El frontend consume `/api/audit` y agrupa la información en un timeline.

## Logs y Monitoreo

- **Request logging**: Todas las peticiones HTTP se registran en consola con formato:
  ```
  [timestamp] METHOD /path - STATUS_CODE - DURATIONms - IP: address
  ```
- **Error logging**: Los errores se registran con timestamp, mensaje, stack trace, método, URL, IP y usuario.
- **Database logging**: Conexión a MongoDB se registra con timestamp, nombre de base de datos y host.
- **Action logging**: Acciones importantes (login, creación de ventas) se registran con detalles relevantes.
- Los logs se muestran en consola con colores según el nivel (INFO, WARN, ERROR, HTTP).

## Despliegue y PM2

1. **Instalar dependencias**:
   ```bash
   npm install --production
   ```
2. **Configurar `.env`** con valores productivos.
3. **Iniciar con PM2**:
   ```bash
   pm2 start index.js --name fs1-backend
   pm2 save
   pm2 startup   # para reinicio automático al encender el servidor
   ```

> El workflow de GitHub Actions ya maneja `pm2 restart fs1-backend` o `pm2 start index.js --name fs1-backend` según exista o no el proceso.

Con esto tienes una referencia completa para extender o mantener la API. Para detalles de la interfaz, consulta [`../frontend/README.md`](../frontend/README.md). Para documentación general del proyecto, visita el README raíz. ¡Éxitos! 🚀
