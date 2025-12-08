# 🛍️ FS1 Inventory & Sales Platform

Solución fullstack MERN para administrar inventarios, ventas y cuentas de usuarios. Los administradores obtienen control total del catálogo, auditoría detallada de acciones y creación de cuentas; los vendedores pueden registrar ventas y monitorear existencias en tiempo real.

> Documentación específica de cada capa:
> - [`backend/README.md`](backend/README.md)
> - [`frontend/README.md`](frontend/README.md)

## 📚 Tabla de contenidos

1. [Características principales](#-características-principales)
2. [Tecnologías](#-tecnologías)
3. [Estructura del repositorio](#-estructura-del-repositorio)
4. [Requisitos previos](#-requisitos-previos)
5. [Configuración y variables de entorno](#-configuración-y-variables-de-entorno)
6. [Scripts y flujo de desarrollo](#-scripts-y-flujo-de-desarrollo)
7. [Automatización y despliegue](#-automatización-y-despliegue)
8. [Credenciales de prueba](#-credenciales-de-prueba)
9. [Seguridad y buenas prácticas](#-seguridad-y-buenas-prácticas)
10. [Solución de problemas](#-solución-de-problemas)

## ✨ Características principales

- **Gestión de productos completa**: CRUD, filtros en tiempo real, modo grid/lista, exportación CSV y reabastecimiento controlado.
- **Ventas inteligentes**: compositor guiado con validaciones de stock, KPIs instantáneos y exportación de reportes.
- **Administración de usuarios**: creación de cuentas sin depender de desarrolladores, cambio de roles y activación/desactivación inmediata.
- **Auditoría centralizada**: cada venta, restock o cambio de usuario queda registrado con actor, entidad y metadatos; panel dedicado para admins.
- **Persistencia de sesión**: AuthContext lee desde `localStorage` para evitar redirecciones al refrescar.
- **Validaciones fullstack**: express-validator, sanitización, Helmet, rate limiting y manejo global de errores.

## 🧱 Tecnologías

| Capa       | Herramientas clave |
|------------|--------------------|
| Backend    | Node.js, Express 5, MongoDB/Mongoose 9, JWT, Bcrypt, Helmet, express-validator, express-rate-limit, express-mongo-sanitize |
| Frontend   | React 19, React Router DOM 7, Vite 7, TailwindCSS 4, Axios, Context API |
| Tooling    | Nodemon, PM2, GitHub Actions, dotenv, eslint |

## 🗂️ Estructura del repositorio

```
fs1Project/
├── backend/               # API REST, modelos y scripts
│   ├── src/
│   │   ├── controllers/   # auth, products, sales, users, audit
│   │   ├── middlewares/   # auth, validation, error handler
│   │   ├── models/        # User, Product, Sale, AuditLog
│   │   └── routes/        # /auth, /products, /sales, /users, /audit, /analytics
│   ├── scripts/           # utilidades (crear usuarios seed)
│   └── README.md          # guía completa backend
├── frontend/              # SPA React
│   ├── src/
│   │   ├── api/           # axios configurado con token
│   │   ├── components/    # Alert, StatCard, PrivateRoute
│   │   ├── context/       # AuthContext
│   │   └── pages/         # Dashboard, Products, Sales, Users, Audit, Login
│   └── README.md          # guía completa frontend
└── .github/workflows/ci.yml   # pipeline CI/CD + restart PM2
```

## ✅ Requisitos previos

- Node.js 18+ y npm 9+
- MongoDB local o Atlas (cadena `MONGO_URI`)
- Git
- (Producción) PM2 o administrador de procesos compatible

## ⚙️ Configuración y variables de entorno

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd fs1Project

cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend (`backend/.env`)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fs1project
JWT_SECRET=super_secreto_123
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

Ambos archivos están documentados con mayor detalle en sus respectivos README.

## 🧪 Scripts y flujo de desarrollo

### Backend

| Script                 | Descripción |
|------------------------|-------------|
| `npm run dev`          | Lanza API con Nodemon y recarga en caliente. |
| `npm start`            | Ejecuta la API con Node (modo producción local). |
| `npm run create-users` | Corre `scripts/createUsers.js` para crear/actualizar cuentas seed (`admin@test.com`, `vendedor@test.com`). |

### Frontend

| Script        | Descripción |
|---------------|-------------|
| `npm run dev` | Inicia Vite + React con HMR en `5173`. |
| `npm run build` | Genera artefactos listos para producción en `dist/`. |
| `npm run preview` | Sirve el build para verificación rápida. |
| `npm run lint` | Ejecuta ESLint con la configuración base proporcionada. |

## 🚀 Automatización y despliegue

- **GitHub Actions (`ci.yml`)**
  - Se ejecuta en cada push a `main` o manualmente (`workflow_dispatch`).
  - Instala dependencias backend/frontend, corre pruebas disponibles, construye el frontend.
  - Instala PM2 y asegura que el proceso `fs1-backend` se reinicie o inicie según corresponda.

- **Despliegue con PM2**
  ```bash
  cd backend
  pm2 start index.js --name fs1-backend
  pm2 save
  pm2 startup
  ```
  El frontend puede desplegarse copiando `frontend/dist` a un servidor estático (Nginx, Vercel, Netlify, etc.).

Consulta los READMEs específicos para instrucciones extendidas sobre Nginx, dominios y seguridad.

## 👤 Credenciales de prueba

| Rol         | Email              | Password     |
|-------------|--------------------|--------------|
| Administrador | `admin@test.com`   | `admin123`   |
| Vendedor    | `vendedor@test.com` | `vendedor123` |

Genera estos usuarios con `npm run create-users` en `backend/`.

## 🔐 Seguridad y buenas prácticas

- Contraseñas hasheadas con `bcrypt`.
- Tokens JWT con expiración de 24h.
- Rate limiting y `helmet` activos para todas las rutas /api.
- Sanitización global de payloads MongoDB.
- Validaciones exhaustivas en controladores y formularios.
- Auditoría persistente para acciones sensibles.

## 🆘 Solución de problemas

| Problema | Revisión recomendada |
|----------|----------------------|
| El frontend redirige al login tras refrescar | Confirma que `localStorage` no se esté limpiando (p. ej., por bloqueadores) y que `AuthContext` pueda leer `token`/`user`. |
| 401/403 en API | Asegura que el header `Authorization: Bearer <token>` se envía (axiosClient lo hace automáticamente si existe `localStorage.token`). |
| Error de conexión a MongoDB | Verifica `MONGO_URI`, estado del servicio y reglas de firewall si usas Atlas. |
| `ValidationError` al restockear | El backend ya usa `validateRestock`; confirma que envías `{ quantity: <int> }` y que la ruta es `PATCH /api/products/:id/restock`. |

¿Dudas adicionales? Revisa los READMEs específicos o abre un issue en el repositorio. ¡Feliz construcción! 💪
