"use client"

import { useContext, useEffect, useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import axiosClient from "../api/axiosClient"
import { AuthContext } from "../context/AuthContext"
import Alert from "../components/Alert"
import StatCard from "../components/StatCard"

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "vendedor",
}

export default function Users() {
  const { auth } = useContext(AuthContext)
  const navigate = useNavigate()
  const isAdmin = auth.user?.role === "admin"
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const fetchUsers = async () => {
    if (!isAdmin) return
    try {
      setLoading(true)
      setError("")
      const { data } = await axiosClient.get("/users")
      setUsers(data)
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar la lista de usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAdmin && !loading) {
      navigate("/")
    }
  }, [isAdmin, loading, navigate])

  const handleRoleChange = async (userId, role) => {
    try {
      setError("")
      setSuccess("")
      await axiosClient.put(`/users/${userId}`, { role })
      setSuccess("Rol actualizado")
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el rol")
    }
  }

  const toggleActive = async (user) => {
    try {
      setError("")
      setSuccess("")
      await axiosClient.patch(`/users/${user._id}/status`, { active: !user.active })
      setSuccess(`Usuario ${!user.active ? "activado" : "desactivado"}`)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el estado")
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!form.name || form.name.trim().length < 2) {
      errors.name = "El nombre debe tener al menos 2 caracteres"
    }
    
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "El email no es válido"
    }
    
    if (!form.password || form.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const createUser = async (e) => {
    e.preventDefault()
    
    // Validación en el frontend
    if (!validateForm()) {
      setError("Por favor, corrige los errores en el formulario")
      return
    }
    
    try {
      setError("")
      setSuccess("")
      setFormErrors({})
      setCreating(true)
      await axiosClient.post("/users", form)
      setSuccess("Usuario creado correctamente")
      setForm(initialForm)
      fetchUsers()
    } catch (err) {
      let errorMessage = "No se pudo crear el usuario"
      
      if (err.response?.data) {
        const data = err.response.data
        
        // Si hay un array de errores, unirlos
        if (Array.isArray(data.errors)) {
          errorMessage = data.errors.join(", ")
        } 
        // Si hay un mensaje directo
        else if (data.message) {
          errorMessage = data.message
        }
        // Si hay un error específico
        else if (data.error) {
          errorMessage = data.error
        }
      }
      
      setError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === "all" ? true : filter === "active" ? user.active : !user.active
      return matchesSearch && matchesFilter
    })
  }, [users, search, filter])

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    vendors: users.filter((u) => u.role === "vendedor").length,
  }
  const overviewStats = [
    { label: "Usuarios activos", value: stats.active, helper: "Con acceso al sistema" },
    { label: "Vendedores", value: stats.vendors, helper: "Rol vendedor asignado" },
    { label: "Total cuentas", value: stats.total, helper: "Incluye admins y vendedores" },
  ]

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-all duration-200 group"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">Dashboard</span>
            </Link>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3rem] text-indigo-500 font-semibold">Usuarios</p>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Gestión de usuarios
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
              <Link to="/products" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                Productos
              </Link>
              <Link to="/sales" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                Ventas
              </Link>
              <Link to="/audit" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                Auditoría
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Administración</p>
                <h2 className="text-3xl font-bold text-gray-900">Usuarios del sistema</h2>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
              Crea, activa, desactiva o cambia el rol de los vendedores cuando sea necesario.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewStats.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
            ))}
          </div>
        </header>

        {success && <Alert variant="success" message={success} onClose={() => setSuccess("")} />}
        {error && <Alert variant="error" message={error} onClose={() => setError("")} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6 space-y-5 hover:shadow-2xl transition-shadow duration-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-bold">Nuevo usuario</p>
                  <h3 className="text-xl font-bold text-gray-900">Crear cuenta</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Usa este formulario para agregar vendedores o nuevos administradores.
              </p>
            </div>

            <form onSubmit={createUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" })
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-300 ${
                    formErrors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="Juan Pérez"
                  required
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 font-medium mt-1">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value })
                    if (formErrors.email) setFormErrors({ ...formErrors, email: "" })
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-300 ${
                    formErrors.email ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="juan@ejemplo.com"
                  required
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 font-medium mt-1">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value })
                    if (formErrors.password) setFormErrors({ ...formErrors, password: "" })
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-300 ${
                    formErrors.password ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                  required
                />
                {formErrors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1">{formErrors.password}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-300"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear usuario
                  </span>
                )}
              </button>
            </form>
          </section>

          <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl lg:col-span-2 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-wrap gap-4 items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Lista de Usuarios</p>
                    <p className="text-xs text-gray-600">
                      {filteredUsers.length} resultados de {stats.total} totales
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 bg-white font-medium"
                >
                  <option value="all">Todos</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Cargando usuarios...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-600 font-medium mb-1">No hay usuarios</p>
                  <p className="text-gray-500 text-sm">No se encontraron usuarios que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 text-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold">Usuario</th>
                      <th className="px-6 py-4 text-left font-bold">Rol</th>
                      <th className="px-6 py-4 text-left font-bold">Estado</th>
                      <th className="px-6 py-4 text-left font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all duration-200 hover:border-blue-300 bg-white"
                          >
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                              user.active
                                ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                                : "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${user.active ? "bg-emerald-500" : "bg-rose-500"}`}
                            ></span>
                            {user.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(user)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 ${
                              user.active
                                ? "border-rose-300 text-rose-600 hover:bg-rose-50 bg-rose-50/50"
                                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50"
                            }`}
                          >
                            {user.active ? "Desactivar" : "Activar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
