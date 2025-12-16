# 🛍️ Sistema de Gestión de Inventario y Ventas (FS1 MERN)

Sistema completo de gestión de inventario y ventas desarrollado con el stack **MERN** (MongoDB, Express, React, Node.js).

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
  - [Health Check](#health-check)
  - [Autenticación](#autenticación)
  - [Usuarios](#usuarios-solo-admin)
  - [Productos](#productos)
  - [Ventas](#ventas)
  - [Analytics](#analytics)
  - [Auditoría](#auditoría-solo-admin)
- [Usuarios de Prueba](#-usuarios-de-prueba)
- [Modelos de Datos](#-modelos-de-datos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Despliegue](#-despliegue)
- [Seguridad](#-seguridad)
- [Troubleshooting](#-troubleshooting)
- [Notas Adicionales](#-notas-adicionales)
- [Autor](#-autor)

## 🎯 Descripción

Sistema web fullstack para la gestión de inventario de productos y registro de ventas. Permite a los administradores gestionar productos y usuarios (CRUD completo) y a los vendedores crear y visualizar ventas, con actualización automática del inventario.

### Roles del Sistema

- **Administrador**: Puede crear, editar y eliminar productos, gestionar usuarios (crear, cambiar roles, activar/desactivar), ver todas las ventas y auditoría
- **Vendedor**: Puede ver productos, crear ventas y ver historial de ventas

## ✨ Características

- ✅ Autenticación JWT con roles (admin/vendedor)
- ✅ CRUD completo de productos
- ✅ Sistema de ventas con validación de stock
- ✅ Actualización automática de inventario
- ✅ Dashboard con analytics y estadísticas en tiempo real
- ✅ Sistema de auditoría completo (registro de todas las acciones)
- ✅ Gestión de usuarios (crear, editar roles, activar/desactivar)
- ✅ UI moderna y responsive con TailwindCSS
- ✅ Validaciones en frontend y backend
- ✅ Manejo de errores centralizado
- ✅ Rate limiting y sanitización de datos
- ✅ Rutas protegidas por roles
- ✅ Interfaz intuitiva y fácil de usar

## 🛠️ Tecnologías

### Backend
- **Node.js** - Entorno de ejecución
- **Express 5.2.1** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose 9.0.1** - ODM para MongoDB
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Express Validator** - Validación de datos
- **Helmet** - Seguridad HTTP
- **Rate Limiting** - Protección contra ataques
- **Mongo Sanitize** - Prevención de NoSQL Injection

### Frontend
- **React 19.2.0** - Biblioteca UI
- **React Router DOM 7.10.1** - Enrutamiento
- **Vite 7.2.4** - Build tool
- **TailwindCSS 4.1.17** - Framework CSS
- **Axios 1.13.2** - Cliente HTTP
- **Context API** - Manejo de estado global

## 📦 Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- MongoDB (local o Atlas)
- Git

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd fs1Project
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configuración

### Backend

1. Crear archivo `.env` en la carpeta `backend/`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fs1project
# O para MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/fs1project

JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_cambiar_en_produccion
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**⚠️ IMPORTANTE**: Cambiar `JWT_SECRET` por un valor aleatorio seguro en producción.

### Frontend

1. Crear archivo `.env` en la carpeta `frontend/` (opcional):

```env
VITE_API_URL=http://localhost:3000/api
```

Por defecto, el frontend usa `http://localhost:3000/api`

## 🎮 Uso

### Desarrollo

#### 1. Crear Usuarios de Prueba

Primero, crea los usuarios de prueba:

```bash
cd backend
npm run create-users
```

#### 2. Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

**Verificar que funciona:**
```bash
curl http://localhost:3000/api/health
```

#### 3. Iniciar el Frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

#### 4. Acceder a la Aplicación

1. Abre `http://localhost:5173` en tu navegador
2. Serás redirigido a `/login`
3. Inicia sesión con:
   - **Admin:** `admin@test.com` / `admin123`
   - **Vendedor:** `vendedor@test.com` / `vendedor123`
4. Una vez autenticado, accederás al Dashboard

### Flujo de la Aplicación

1. **Login** (`/login`)
   - Usuario ingresa email y password
   - Sistema valida credenciales
   - Si es válido, guarda token en localStorage y redirige al Dashboard

2. **Dashboard** (`/`)
   - Muestra estadísticas generales del sistema (ingresos totales, ventas registradas, productos en inventario, ítems con poco stock)
   - Gráficos de tendencias de ventas (últimos 7 días)
   - Top 5 productos más vendidos
   - Productos con bajo stock (≤5 unidades)
   - Ventas recientes
   - Acceso rápido a Productos, Ventas, Usuarios (solo admin) y Auditoría (solo admin)
   - Botón de cerrar sesión

3. **Productos** (`/products`)
   - **Admin:** Puede crear, editar y eliminar productos
   - **Vendedor:** Solo puede ver la lista de productos
   - Lista muestra: nombre, categoría, precio y stock
   - Filtros y búsqueda disponibles

4. **Ventas** (`/sales`)
   - Todos los usuarios pueden crear ventas
   - Seleccionar productos del dropdown (solo con stock > 0)
   - Agregar cantidad y agregar al carrito
   - Ver total calculado automáticamente
   - Confirmar venta (actualiza stock automáticamente)
   - Ver historial de todas las ventas con detalles

5. **Usuarios** (`/users`) - Solo Admin
   - Crear nuevos usuarios (admin o vendedor)
   - Ver lista de todos los usuarios del sistema
   - Cambiar roles de usuarios (admin/vendedor)
   - Activar/desactivar usuarios
   - Buscar y filtrar usuarios por estado

6. **Auditoría** (`/audit`) - Solo Admin
   - Ver registro completo de todas las actividades del sistema
   - Filtrar por tipo de acción (creación de productos, ventas, cambios de usuario, etc.)
   - Buscar eventos por usuario, entidad o acción
   - Timeline agrupado por fecha
   - Estadísticas de eventos (últimas 24h, usuarios involucrados, etc.)

### Producción

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## 📡 API Endpoints

**Base URL:** `http://localhost:3000/api`

**Autenticación:** La mayoría de endpoints requieren el header:
```
Authorization: Bearer <token>
```

### Health Check

#### `GET /api/health`
Verifica el estado del servidor (no requiere autenticación)

**Response 200:**
```json
{
  "status": "OK",
  "timestamp": "2024-12-07T10:30:00.000Z"
}
```

### Autenticación

#### `POST /api/auth/login`
Inicia sesión de usuario

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Errores:**
- `400` - Credenciales inválidas
- `400` - Error de validación (email o password faltante/inválido)
- `429` - Demasiados intentos (rate limit: 5 intentos por 15 minutos)

**Validaciones:**
- Email debe ser válido
- Password es requerido

### Usuarios (Solo Admin)

#### `GET /api/users`
Obtiene todos los usuarios del sistema

**Autenticación:** Requerida (solo admin)

**Response 200:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Usuario Ejemplo",
    "email": "usuario@example.com",
    "role": "vendedor",
    "active": true,
    "createdAt": "2024-12-07T10:30:00.000Z",
    "updatedAt": "2024-12-07T10:30:00.000Z"
  }
]
```

**Nota:** Las contraseñas nunca se devuelven en las respuestas.

**Errores:**
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)

---

#### `POST /api/users`
Crea un nuevo usuario

**Autenticación:** Requerida (solo admin)

**Body:**
```json
{
  "name": "Nuevo Usuario",
  "email": "usuario@example.com",
  "password": "password123",
  "role": "vendedor"
}
```

**Response 201:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nuevo Usuario",
  "email": "usuario@example.com",
  "role": "vendedor",
  "active": true,
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T10:30:00.000Z"
}
```

**Errores:**
- `400` - Email ya existe
- `400` - Error de validación
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)

**Validaciones:**
- Name: 2-100 caracteres, requerido
- Email: formato válido, único, requerido
- Password: mínimo 6 caracteres, requerido
- Role: "admin" o "vendedor" (opcional, default: "vendedor")

---

#### `PUT /api/users/:id`
Actualiza el rol de un usuario

**Autenticación:** Requerida (solo admin)

**Parámetros:**
- `id` - ID del usuario (MongoDB ObjectId)

**Body:**
```json
{
  "role": "admin"
}
```

**Response 200:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Usuario Ejemplo",
  "email": "usuario@example.com",
  "role": "admin",
  "active": true,
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T10:30:00.000Z"
}
```

**Errores:**
- `400` - ID inválido
- `400` - El rol debe ser 'admin' o 'vendedor'
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)
- `404` - Usuario no encontrado

---

#### `PATCH /api/users/:id/status`
Activa o desactiva un usuario

**Autenticación:** Requerida (solo admin)

**Parámetros:**
- `id` - ID del usuario (MongoDB ObjectId)

**Body:**
```json
{
  "active": false
}
```

**Response 200:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Usuario Ejemplo",
  "email": "usuario@example.com",
  "role": "vendedor",
  "active": false,
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T10:30:00.000Z"
}
```

**Errores:**
- `400` - ID inválido
- `400` - El campo 'active' debe ser un booleano
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)
- `404` - Usuario no encontrado

### Productos

#### `GET /api/products`
Obtiene todos los productos ordenados por fecha de creación (más recientes primero)

**Autenticación:** Requerida

**Response 200:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Producto Ejemplo",
    "category": "Electrónica",
    "price": 29.99,
    "stock": 100,
    "description": "Descripción del producto",
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": "2024-12-07T10:30:00.000Z",
    "updatedAt": "2024-12-07T10:30:00.000Z"
  }
]
```

**Errores:**
- `401` - No autenticado

---

#### `GET /api/products/:id`
Obtiene un producto por ID

**Autenticación:** Requerida

**Response 200:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Producto Ejemplo",
  "category": "Electrónica",
  "price": 29.99,
  "stock": 100,
  "description": "Descripción del producto",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T10:30:00.000Z"
}
```

**Errores:**
- `400` - ID inválido
- `401` - No autenticado
- `404` - Producto no encontrado

---

#### `POST /api/products`
Crea un nuevo producto

**Autenticación:** Requerida (solo admin)

**Body:**
```json
{
  "name": "Producto Ejemplo",
  "category": "Electrónica",
  "price": 29.99,
  "stock": 100,
  "description": "Descripción opcional",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response 201:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Producto Ejemplo",
  "category": "Electrónica",
  "price": 29.99,
  "stock": 100,
  "description": "Descripción opcional",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T10:30:00.000Z"
}
```

**Errores:**
- `400` - Error de validación
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)

**Validaciones:**
- Name: 2-200 caracteres, requerido
- Category: 2-100 caracteres, requerido
- Price: número positivo, requerido
- Stock: entero positivo o cero, requerido
- Description: máximo 1000 caracteres (opcional)
- ImageUrl: URL válida (opcional)

---

#### `PUT /api/products/:id`
Actualiza un producto

**Autenticación:** Requerida (solo admin)

**Body:** (todos los campos son opcionales, solo envía los que quieres actualizar)
```json
{
  "name": "Producto Actualizado",
  "price": 39.99,
  "stock": 150
}
```

**Response 200:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Producto Actualizado",
  "category": "Electrónica",
  "price": 39.99,
  "stock": 150,
  "description": "Descripción opcional",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T11:00:00.000Z"
}
```

**Errores:**
- `400` - ID inválido o error de validación
- `400` - Stock o precio negativo
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)
- `404` - Producto no encontrado

---

#### `DELETE /api/products/:id`
Elimina un producto

**Autenticación:** Requerida (solo admin)

**Response 200:**
```json
{
  "message": "Producto eliminado exitosamente"
}
```

**Errores:**
- `400` - ID inválido
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)
- `404` - Producto no encontrado

### Ventas

#### `GET /api/sales`
Obtiene todas las ventas ordenadas por fecha (más recientes primero)

**Autenticación:** Requerida

**Response 200:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Vendedor",
      "email": "vendedor@test.com"
    },
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Producto 1",
          "category": "Electrónica",
          "price": 29.99
        },
        "quantity": 2,
        "price": 29.99
      }
    ],
    "total": 59.98,
    "createdAt": "2024-12-07T10:30:00.000Z",
    "updatedAt": "2024-12-07T10:30:00.000Z"
  }
]
```

**Errores:**
- `401` - No autenticado

---

#### `POST /api/sales`
Crea una nueva venta y actualiza automáticamente el stock de los productos

**Autenticación:** Requerida

**Body:**
```json
{
  "items": [
    {
      "product": "507f1f77bcf86cd799439014",
      "quantity": 2
    },
    {
      "product": "507f1f77bcf86cd799439015",
      "quantity": 1
    }
  ]
}
```

**Response 201:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user": "507f1f77bcf86cd799439012",
  "items": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "product": "507f1f77bcf86cd799439014",
      "quantity": 2,
      "price": 29.99
    },
    {
      "_id": "507f1f77bcf86cd799439016",
      "product": "507f1f77bcf86cd799439015",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "total": 109.97,
  "createdAt": "2024-12-07T10:30:00.000Z",
  "updatedAt": "2024-12-07T10:30:00.000Z"
}
```

**Errores:**
- `400` - No se enviaron productos
- `400` - Error de validación
- `404` - Producto no encontrado
- `400` - Stock insuficiente para algún producto
- `401` - No autenticado

**Validaciones:**
- Items: array con al menos 1 producto, requerido
- Product: ID de MongoDB válido, requerido
- Quantity: entero positivo, requerido

**Nota:** El sistema valida automáticamente que haya stock suficiente antes de crear la venta y actualiza el inventario.

---

#### `GET /api/sales/export` (Solo Admin)
**⚠️ NOTA:** Este endpoint está referenciado en el frontend pero aún no está implementado en el backend. Se planea para exportar ventas en formato CSV.

**Autenticación:** Requerida (solo admin)

**Response esperado (cuando se implemente):**
- Archivo CSV con todas las ventas
- Headers: Fecha, Usuario, Productos, Cantidad, Precio Unitario, Total

### Analytics

#### `GET /api/analytics/summary`
Obtiene un resumen completo de estadísticas del sistema

**Autenticación:** Requerida

**Response 200:**
```json
{
  "products": {
    "total": 50,
    "totalInventoryUnits": 1250,
    "inventoryValue": 125000.50,
    "lowStockItems": 3,
    "lowStockProducts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Producto Ejemplo",
        "category": "Electrónica",
        "stock": 2
      }
    ]
  },
  "sales": {
    "totalRevenue": 50000.00,
    "totalSales": 150,
    "bestSellers": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Producto Más Vendido",
        "category": "Electrónica",
        "quantity": 100,
        "revenue": 5000.00
      }
    ],
    "recentSales": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "user": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Vendedor",
          "email": "vendedor@test.com"
        },
        "items": [
          {
            "product": {
              "_id": "507f1f77bcf86cd799439013",
              "name": "Producto 1",
              "category": "Electrónica",
              "price": 29.99
            },
            "quantity": 2,
            "price": 29.99
          }
        ],
        "total": 59.98,
        "createdAt": "2024-12-07T10:30:00.000Z"
      }
    ],
    "trend": [
      {
        "date": "2024-12-1-7",
        "totalRevenue": 1000.00,
        "totalSales": 10
      }
    ]
  }
}
```

**Errores:**
- `401` - No autenticado

---

### Auditoría (Solo Admin)

#### `GET /api/audit`
Obtiene el registro de auditoría del sistema

**Autenticación:** Requerida (solo admin)

**Query Parameters:**
- `action` (opcional) - Filtrar por tipo de acción (ej: `PRODUCT_CREATED`, `SALE_CREATED`, `USER_UPDATED`)
- `entityType` (opcional) - Filtrar por tipo de entidad (ej: `product`, `user`, `sale`)
- `limit` (opcional) - Número de resultados (default: 50, máximo: 200)

**Response 200:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "action": "PRODUCT_CREATED",
    "entityType": "product",
    "entityId": "507f1f77bcf86cd799439012",
    "entityName": "Nuevo Producto",
    "performedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Admin",
      "email": "admin@test.com",
      "role": "admin"
    },
    "details": "Producto creado exitosamente",
    "metadata": {
      "price": 29.99,
      "stock": 100
    },
    "createdAt": "2024-12-07T10:30:00.000Z",
    "updatedAt": "2024-12-07T10:30:00.000Z"
  }
]
```

**Errores:**
- `401` - No autenticado
- `403` - No tiene permisos (no es admin)

**Acciones registradas:**
- `PRODUCT_CREATED` - Producto creado
- `PRODUCT_UPDATED` - Producto editado
- `PRODUCT_DELETED` - Producto eliminado
- `PRODUCT_RESTOCKED` - Stock incrementado
- `USER_CREATED` - Usuario creado
- `USER_UPDATED` - Usuario actualizado
- `USER_STATUS_CHANGED` - Estado de usuario cambiado
- `SALE_CREATED` - Venta registrada

## 👥 Usuarios de Prueba

### Método 1: Script Automático (Recomendado)

El proyecto incluye un script para crear usuarios de prueba automáticamente:

```bash
cd backend
npm run create-users
```

Este script crea dos usuarios:
- **Administrador:** `admin@test.com` / `admin123`
- **Vendedor:** `vendedor@test.com` / `vendedor123`

### Método 2: Endpoint API (Requiere Admin)

Si ya tienes un usuario admin, puedes crear más usuarios usando el endpoint:

```bash
POST /api/users
Authorization: Bearer <token_admin>

{
  "name": "Nuevo Usuario",
  "email": "usuario@test.com",
  "password": "password123",
  "role": "vendedor"
}
```

### Método 3: MongoDB Directo

Si necesitas crear usuarios directamente en MongoDB:

```javascript
// Conectarse a MongoDB
use fs1project

// Importar bcrypt (en Node.js)
const bcrypt = require('bcryptjs');
const adminPassword = await bcrypt.hash("admin123", 10);
const vendedorPassword = await bcrypt.hash("vendedor123", 10);

// Crear usuario administrador
db.users.insertOne({
  name: "Administrador",
  email: "admin@test.com",
  password: adminPassword,
  role: "admin",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Crear usuario vendedor
db.users.insertOne({
  name: "Vendedor",
  email: "vendedor@test.com",
  password: vendedorPassword,
  role: "vendedor",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Credenciales de Prueba

Una vez creados los usuarios con el script, puedes usar:

**Administrador:**
- Email: `admin@test.com`
- Password: `admin123`
- Permisos: Crear/editar/eliminar productos, crear usuarios, ver todas las ventas

**Vendedor:**
- Email: `vendedor@test.com`
- Password: `vendedor123`
- Permisos: Ver productos, crear ventas, ver historial de ventas

## 📊 Modelos de Datos

### User (Usuario)
```javascript
{
  _id: ObjectId,
  name: String (requerido, 2-100 caracteres),
  email: String (requerido, único, formato email),
  password: String (requerido, hash bcrypt),
  role: String (enum: ["admin", "vendedor"], default: "vendedor"),
  active: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Product (Producto)
```javascript
{
  _id: ObjectId,
  name: String (requerido, 2-200 caracteres),
  category: String (requerido, 2-100 caracteres),
  price: Number (requerido, positivo),
  stock: Number (requerido, entero >= 0),
  description: String (opcional, máximo 1000 caracteres),
  imageUrl: String (opcional, URL válida),
  createdAt: Date,
  updatedAt: Date
}
```

### Sale (Venta)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, requerido),
  items: [
    {
      product: ObjectId (ref: Product, requerido),
      quantity: Number (requerido, entero >= 1),
      price: Number (requerido, precio al momento de la venta)
    }
  ],
  total: Number (requerido, suma de items),
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog (Registro de Auditoría)
```javascript
{
  _id: ObjectId,
  action: String (requerido, ej: "PRODUCT_CREATED", "SALE_CREATED"),
  entityType: String (requerido, ej: "product", "user", "sale"),
  entityId: String (opcional, ID de la entidad afectada),
  entityName: String (opcional, nombre de la entidad),
  performedBy: ObjectId (ref: User, usuario que realizó la acción),
  details: String (opcional, descripción de la acción),
  metadata: Mixed (opcional, datos adicionales como cantidad, total, etc.),
  createdAt: Date,
  updatedAt: Date
}
```

## 📁 Estructura del Proyecto

```
fs1Project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Configuración MongoDB
│   │   ├── controllers/
│   │   │   ├── authController.js  # Lógica de autenticación
│   │   │   ├── productController.js
│   │   │   ├── saleController.js
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js  # JWT y autorización
│   │   │   ├── errorHandler.js    # Manejo de errores
│   │   │   └── validation.js      # Validaciones
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Sale.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── saleRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   └── auditRoutes.js
│   │   ├── utils/
│   │   │   └── auditLogger.js
│   │   └── app.js                 # Configuración Express
│   ├── index.js                   # Punto de entrada
│   ├── package.json
│   └── .env                       # Variables de entorno
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.jsx    # Cliente HTTP configurado
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx   # Ruta protegida
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Context de autenticación
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Users.jsx
│   │   │   └── Audit.jsx
│   │   ├── components/
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── Alert.jsx
│   │   │   └── StatCard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🚀 Despliegue

### Backend en OCI (Oracle Cloud Infrastructure)

1. **SSH a la instancia:**
   ```bash
   ssh ubuntu@150.136.245.153 -i ssh-key-2025-12-07.key
   ```

2. **Instalar Node.js y PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Clonar y configurar el proyecto:**
   ```bash
   git clone <repo-url>
   cd fs1Project/backend
   npm install
   ```

4. **Configurar variables de entorno:**
   ```bash
   nano .env
   # Agregar todas las variables necesarias
   ```

5. **Iniciar con PM2:**
   ```bash
   pm2 start index.js --name fs1-backend
   pm2 save
   pm2 startup
   ```

6. **Configurar Nginx (opcional):**
   ```bash
   sudo apt-get install nginx
   # Configurar proxy reverso en /etc/nginx/sites-available/default
   ```

### Frontend

1. **Build del proyecto:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Desplegar con Nginx:**
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```

O usar un servicio como Vercel, Netlify, etc.

## 🔒 Seguridad

### Medidas Implementadas

- ✅ **Contraseñas hasheadas** con bcrypt (salt rounds: 10)
- ✅ **JWT para autenticación** con expiración de 1 día
- ✅ **Rate limiting:**
  - General: 100 requests por 15 minutos
  - Login: 5 intentos por 15 minutos
- ✅ **Sanitización de entradas** MongoDB (previene NoSQL injection)
- ✅ **Helmet** para headers de seguridad HTTP
- ✅ **Validación de datos** con express-validator en todas las rutas
- ✅ **CORS configurado** con origen específico
- ✅ **Variables de entorno** para secrets (JWT_SECRET, MONGO_URI)
- ✅ **Validación de roles** en backend (middleware) y frontend (UI)
- ✅ **Manejo de errores centralizado** sin exponer información sensible
- ✅ **Validación de stock** antes de crear ventas
- ✅ **Validación de precios/stock** no negativos
- ✅ **Sistema de auditoría** que registra todas las acciones importantes del sistema
- ✅ **Analytics en tiempo real** con agregaciones de MongoDB para estadísticas precisas

### Headers de Seguridad (Helmet)

El servidor incluye headers de seguridad automáticos:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Y más...

### Interceptor de Axios

El frontend incluye interceptores que:
- Agregan automáticamente el token JWT a todas las peticiones
- Redirigen a `/login` si recibe 401 o 403
- Limpian localStorage en caso de error de autenticación

## 🐛 Troubleshooting

### Error de conexión a MongoDB

**Síntoma:** `Error conectando a MongoDB` o `MongooseServerSelectionError`

**Soluciones:**
1. Verificar que MongoDB esté corriendo:
   ```bash
   # Local
   mongod
   
   # O verificar servicio
   sudo systemctl status mongod
   ```

2. Verificar la URI en `.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/fs1project
   ```

3. Para MongoDB Atlas:
   - Verificar credenciales
   - Verificar que la IP esté en la whitelist
   - Verificar que la conexión use `mongodb+srv://`

### Error de CORS

**Síntoma:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Soluciones:**
1. Verificar `FRONTEND_URL` en `.env` del backend:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

2. Verificar que el frontend esté en el puerto correcto (5173 por defecto)

3. Reiniciar el servidor backend después de cambiar `.env`

### Error de autenticación

**Síntoma:** `401 Unauthorized` o redirección constante al login

**Soluciones:**
1. Verificar que el token se esté enviando:
   - Abrir DevTools → Network
   - Verificar header `Authorization: Bearer <token>`

2. Verificar que `JWT_SECRET` esté configurado en `.env`

3. Limpiar localStorage y volver a iniciar sesión:
   ```javascript
   localStorage.clear()
   ```

### Error de rate limiting

**Síntoma:** `429 Too Many Requests`

**Soluciones:**
- Esperar 15 minutos o reiniciar el servidor
- El rate limit se aplica por IP

### Error de validación

**Síntoma:** `400 Bad Request` con mensaje de validación

**Soluciones:**
- Revisar el mensaje de error que indica qué campo falló
- Verificar que todos los campos requeridos estén presentes
- Verificar formatos (email, números, etc.)

### El servidor no inicia

**Síntoma:** Error al ejecutar `npm run dev`

**Soluciones:**
1. Verificar que todas las dependencias estén instaladas:
   ```bash
   npm install
   ```

2. Verificar que el puerto 3000 no esté en uso:
   ```bash
   lsof -i :3000
   # Si está en uso, cambiar PORT en .env
   ```

3. Verificar que `.env` exista y tenga todas las variables necesarias

## 📝 Notas Adicionales

### Funcionalidades Automáticas

- ✅ **Validación de stock:** El sistema valida automáticamente que haya stock suficiente antes de crear ventas
- ✅ **Actualización de inventario:** Los productos se actualizan automáticamente al realizar ventas (stock se reduce)
- ✅ **Cálculo de totales:** El total de la venta se calcula automáticamente sumando (precio × cantidad) de cada item
- ✅ **Precio fijo en ventas:** El precio se guarda al momento de la venta (no cambia aunque el producto se actualice después)
- ✅ **Registro de auditoría:** Todas las acciones importantes (creación/edición/eliminación de productos, creación de ventas, gestión de usuarios) se registran automáticamente en el sistema de auditoría
- ✅ **Cálculo de analytics:** El dashboard calcula automáticamente estadísticas de productos, ventas, tendencias y productos más vendidos

### Permisos por Rol

**Administrador:**
- ✅ Crear, editar y eliminar productos
- ✅ Crear usuarios
- ✅ Cambiar roles de usuarios (admin/vendedor)
- ✅ Activar/desactivar usuarios
- ✅ Ver todas las ventas
- ✅ Crear ventas
- ✅ Ver dashboard con analytics completas
- ✅ Acceder a registro de auditoría completo

**Vendedor:**
- ✅ Ver productos (solo lectura)
- ✅ Crear ventas
- ✅ Ver historial de ventas
- ✅ Ver dashboard con estadísticas básicas

### Validaciones Importantes

- **Stock mínimo:** No se puede vender si el stock es 0 o menor a la cantidad solicitada
- **Precios negativos:** No se permiten precios o stocks negativos
- **Email único:** Cada email solo puede estar registrado una vez
- **IDs válidos:** Todos los IDs de MongoDB deben tener formato válido
- **Cantidades:** Las cantidades en ventas deben ser enteros positivos

### Manejo de Errores

El sistema maneja errores de forma centralizada:
- Errores de validación: Devuelve mensajes claros
- Errores de autenticación: Redirige al login
- Errores de autorización: Muestra mensaje de permisos insuficientes
- Errores de servidor: No expone información sensible en producción

## 🔄 Flujo de Datos

### Autenticación
```
Usuario → Login (POST /api/auth/login)
  ↓
Backend valida credenciales
  ↓
Genera JWT token
  ↓
Frontend guarda token en localStorage
  ↓
Token se envía en headers de todas las peticiones
```

### Crear Venta
```
Usuario selecciona productos y cantidades
  ↓
Frontend envía POST /api/sales con items
  ↓
Backend valida stock disponible
  ↓
Backend actualiza stock de productos
  ↓
Backend crea registro de venta
  ↓
Frontend actualiza lista de productos y ventas
```

### Gestión de Productos (Admin)
```
Admin crea/edita producto
  ↓
Frontend envía POST/PUT /api/products
  ↓
Backend valida datos y permisos
  ↓
Backend guarda/actualiza en MongoDB
  ↓
Frontend actualiza lista de productos
```

## 📚 Recursos Adicionales

### Scripts Disponibles

**Backend:**
- `npm run dev` - Inicia servidor en modo desarrollo (nodemon)
- `npm start` - Inicia servidor en modo producción
- `npm run create-users` - Crea usuarios de prueba

**Frontend:**
- `npm run dev` - Inicia servidor de desarrollo (Vite)
- `npm run build` - Crea build de producción
- `npm run preview` - Previsualiza build de producción

### Variables de Entorno Completas

**Backend (.env):**
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fs1project
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env) - Opcional:**
```env
VITE_API_URL=http://localhost:3000/api
```
