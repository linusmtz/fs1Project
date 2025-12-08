# 🎨 Frontend – FS1 Inventory & Sales Platform

SPA construida con **React + Vite + TailwindCSS**. Ofrece dashboards, gestión de inventario, registro de ventas y paneles de administración/auditoría.

## Índice

1. [Stack y dependencias](#stack-y-dependencias)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Variables de entorno](#variables-de-entorno)
4. [Scripts disponibles](#scripts-disponibles)
5. [Arquitectura y componentes clave](#arquitectura-y-componentes-clave)
6. [Patrones de UI/UX](#patrones-de-uiux)
7. [Integración con API](#integración-con-api)
8. [Pruebas y validaciones](#pruebas-y-validaciones)

## Stack y dependencias

- **React 19** (Hooks y Context API).
- **React Router DOM 7** para protección de rutas.
- **Vite 7** como bundler.
- **TailwindCSS 4** para estilos utilitarios.
- **Axios 1.13** para HTTP, configurado con interceptores.
- **ESLint 9** con reglas para React y Hooks.

## Estructura de carpetas

```
frontend/
├── public/              # Assets estáticos
├── src/
│   ├── api/
│   │   └── axiosClient.jsx     # Base URL + interceptor de token/errores
│   ├── components/
│   │   ├── Alert.jsx           # Mensajes reutilizables (success/error/info)
│   │   ├── StatCard.jsx        # Tarjetas de métricas
│   │   └── PrivateRoute.jsx    # Protege rutas privadas
│   ├── context/
│   │   └── AuthContext.jsx     # Auth global con persistencia en localStorage
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── Sales.jsx
│   │   ├── Users.jsx
│   │   └── Audit.jsx
│   ├── App.jsx                 # Definición de rutas
│   ├── main.jsx                # Punto de entrada
│   └── index.css               # Estilos globales
├── package.json
└── vite.config.js
```

## Variables de entorno

Crear `frontend/.env` (opcional si usas los valores por defecto):

```env
VITE_API_URL=http://localhost:3000/api
```

`axiosClient` utiliza esta variable para construir la `baseURL`.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia Vite con HMR en `http://localhost:5173`. |
| `npm run build` | Genera los archivos listos para producción en `dist/`. |
| `npm run preview` | Sirve el build generado (útil para inspección previa a deploy). |
| `npm run lint` | Ejecuta ESLint sobre todo el proyecto. |

## Arquitectura y componentes clave

- **Contexto de Autenticación** (`context/AuthContext.jsx`): guarda `token` + `user` en localStorage y repuebla el estado al cargar la app para evitar redirecciones no deseadas al refrescar.
- **axiosClient**: inserta automáticamente el token en cada petición y redirige al login si recibe `401/403`, limpiando el storage.
- **Pages**:
  - `Dashboard`: KPIs, best sellers, insight modes (resumen/detallado) y exportación CSV de ventas.
  - `Products`: formularios avanzados, filtros, paginación, restock modal y exportación.
  - `Sales`: compositor de ventas con validaciones, métricas y timelines.
  - `Users` (solo admins): creación de cuentas, filtros, cambio de roles y activación/desactivación.
  - `Audit` (solo admins): timeline por día, filtros por acción/actor y búsqueda global.
- **Componentes compartidos**:
  - `Alert`: mensajes contextualizados, se usan en productos, ventas y usuarios.
  - `StatCard`: KPIs reusables con helper text.

## Patrones de UI/UX

- Diseño responsive basado en Gradientes/Tailwind.
- Chip filters, timeline cards y modales accesibles.
- Interacciones suaves con `group-hover`, `transition` y `animate-spin/pulse`.
- Las secciones incluyen breadcrumbs o enlaces de retorno al dashboard para no perder contexto.

## Integración con API

- Todas las rutas están declaradas en `App.jsx` y protegidas por `PrivateRoute`.
- `axiosClient` apunta a `/api` y maneja:
  - Header `Authorization` con `Bearer <token>`.
  - Errores globales: 401/403 limpian sesión y redirigen al login.
- Formularios usan `useState` y validaciones básicas antes de enviar.
- La página de auditoría hace requests paginadas/filtradas usando query params (`action`, `limit`).

## Pruebas y validaciones

Actualmente no existen pruebas unitarias, pero se recomienda:

1. Ejecutar `npm run lint` antes de subir cambios.
2. Validar manualmente:
   - Inicio/cierre de sesión.
   - Permisos de navegación según rol.
   - Creación/edición de productos y usuarios.
   - Registro de ventas/restock y visualización en el panel de auditoría.

Para más detalles sobre endpoints, consultar [`../backend/README.md`](../backend/README.md).
