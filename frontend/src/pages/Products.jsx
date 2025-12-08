"use client"

import { useEffect, useState, useContext, useMemo } from "react"
import { Link } from "react-router-dom"
import axiosClient from "../api/axiosClient"
import { AuthContext } from "../context/AuthContext"
import Alert from "../components/Alert"
import StatCard from "../components/StatCard"

const PRODUCTS_PER_PAGE = 6

export default function Products() {
  const { auth } = useContext(AuthContext)
  const isAdmin = auth.user?.role === "admin"

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [restockTarget, setRestockTarget] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState(10)
  const [restockLoading, setRestockLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    imageUrl: "",
  })
  const [viewMode, setViewMode] = useState("list")
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await axiosClient.get("/products")
        setProducts(response.data)
        setError("")
      } catch (err) {
        setError("Error al cargar los productos. Intenta de nuevo más tarde.")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
      description: "",
      imageUrl: "",
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const productData = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    }

    try {
      if (editingId) {
        await axiosClient.put(`/products/${editingId}`, productData)
        setProducts((prev) => prev.map((p) => (p._id === editingId ? { ...productData, _id: editingId } : p)))
        setSuccess("Producto actualizado exitosamente!")
      } else {
        const response = await axiosClient.post("/products", productData)
        setProducts((prev) => [...prev, response.data])
        setSuccess("Producto creado exitosamente!")
      }
      resetForm()
      setCurrentPage(1) // Reset to first page after adding/editing
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el producto.")
    }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) return
    try {
      await axiosClient.delete(`/products/${id}`)
      setProducts((prev) => prev.filter((p) => p._id !== id))
      setSuccess("Producto eliminado exitosamente!")
      if (paginatedProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1) // Go to previous page if last item deleted
      }
    } catch (err) {
      setError("Error al eliminar el producto.")
    }
  }

  const handleEdit = (product) => {
    setEditingId(product._id)
    setForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      imageUrl: product.imageUrl,
    })
    setFiltersOpen(true) // Ensure filters are open to see the form
  }

  const openRestockModal = (product) => {
    setRestockTarget(product)
    setRestockQuantity(10) // Default quantity
  }

  const handleRestock = async (e) => {
    e.preventDefault()
    if (!restockTarget) return
    setRestockLoading(true)
    setError("")
    setSuccess("")
    try {
      const response = await axiosClient.patch(`/products/${restockTarget._id}/restock`, {
        quantity: Number(restockQuantity),
      })
      setProducts((prev) => prev.map((p) => (p._id === restockTarget._id ? response.data.product : p)))
      setRestockTarget(null) // Close modal
      setSuccess("Inventario actualizado exitosamente!")
    } catch (err) {
      setError(err.response?.data?.message || "Error al reabastecer el producto.")
    } finally {
      setRestockLoading(false)
    }
  }

  const exportCSV = () => {
    const csvRows = [
      [
        "ID",
        "Nombre",
        "Categoría",
        "Precio",
        "Stock",
        "Descripción",
        "Imagen URL",
        "Fecha Creación",
        "Fecha Actualización",
      ],
      ...sortedProducts.map((p) => [
        p._id,
        p.name,
        p.category,
        p.price.toFixed(2),
        p.stock,
        p.description,
        p.imageUrl,
        new Date(p.createdAt).toLocaleString(),
        new Date(p.updatedAt).toLocaleString(),
      ]),
    ]

    const csvString = csvRows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download) {
      link.setAttribute("href", URL.createObjectURL(blob))
      link.setAttribute("download", "products.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const categoryCounts = useMemo(() => {
    return products.reduce((acc, product) => {
      if (!product.category) return acc
      acc[product.category] = (acc[product.category] || 0) + 1
      return acc
    }, {})
  }, [products])

  const categories = Object.keys(categoryCounts)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === "all" ? true : product.category === categoryFilter
      const matchesStock = showLowStock ? product.stock <= 5 : true
      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, search, categoryFilter, showLowStock])

  const sortedProducts = useMemo(() => {
    const data = [...filteredProducts]
    switch (sortBy) {
      case "price-desc":
        return data.sort((a, b) => Number(b.price) - Number(a.price))
      case "price-asc":
        return data.sort((a, b) => Number(a.price) - Number(b.price))
      case "stock-asc":
        return data.sort((a, b) => Number(a.stock) - Number(b.stock))
      case "stock-desc":
        return data.sort((a, b) => Number(b.stock) - Number(a.stock))
      default:
        return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  }, [filteredProducts, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE))
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)

  const currentInventoryValue = products.reduce((acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0), 0)
  const inventoryStats = [
    {
      label: "Productos totales",
      value: products.length,
      helper: "Registros en inventario",
    },
    {
      label: "Inventario disponible",
      value: products.reduce((acc, p) => acc + Number(p.stock || 0), 0),
      helper: "Unidades sumadas",
    },
    {
      label: "Valor inventario",
      value: `$${currentInventoryValue.toFixed(2)}`,
      helper: "Calculado por stock x precio",
    },
  ]

  const isGridView = viewMode === "grid"
  const filterChips = [
    search
      ? {
          label: `Búsqueda: ${search}`,
          clear: () => {
            setSearch("")
            setCurrentPage(1)
          },
        }
      : null,
    categoryFilter !== "all"
      ? {
          label: `Categoría: ${categoryFilter}`,
          clear: () => {
            setCategoryFilter("all")
            setCurrentPage(1)
          },
        }
      : null,
    showLowStock
      ? {
          label: "Solo poco stock",
          clear: () => {
            setShowLowStock(false)
            setCurrentPage(1)
          },
        }
      : null,
  ].filter(Boolean)
  const filterSummary = filterChips.length ? filterChips.map((chip) => chip.label).join(" · ") : "Sin filtros activos"
  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setShowLowStock(false)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 group"
            >
              <svg
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Volver al Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Productos
              </h1>
            </div>
            <div className="hidden sm:flex items-center space-x-4 text-sm font-medium">
              <Link to="/sales" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                Ventas
              </Link>
              {isAdmin && (
                <Link to="/users" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Usuarios
                </Link>
              )}
              {isAdmin && (
                <Link to="/audit" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Auditoría
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Alert variant="success" message={success} onClose={() => setSuccess("")} />
        <Alert variant="error" message={error} onClose={() => setError("")} />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {inventoryStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {isAdmin && (
            <section className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        {editingId ? "Modo Edición" : "Crear Nuevo"}
                      </p>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingId ? "Actualiza el catálogo" : "Nuevo Producto"}
                    </h2>
                  </div>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                      <input
                        type="text"
                        placeholder="Ej. Camiseta Premium"
                        value={form.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                      <input
                        type="text"
                        placeholder="Categoría o colección"
                        value={form.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-semibold">
                          $
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.stock}
                        onChange={(e) => handleInputChange("stock", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                    <textarea
                      rows={3}
                      placeholder="¿Qué hace especial a este producto?"
                      value={form.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 bg-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen (URL)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    {editingId ? "Actualizar Producto" : "Crear Producto"}
                  </button>
                </form>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 space-y-4 shadow-md">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <p className="text-sm font-bold text-indigo-700 uppercase tracking-wide">Vista Previa</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-5 flex gap-4 hover:shadow-lg transition-shadow duration-200">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-indigo-100">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl || "/placeholder.svg"}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{form.name || "Nombre del producto"}</h3>
                    <p className="text-sm text-gray-500 font-medium">{form.category || "Categoría"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xl text-indigo-600 font-bold">
                        {form.price ? `$${Number(form.price).toFixed(2)}` : "$0.00"}
                      </p>
                      {form.stock && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          Stock: {form.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className={isAdmin ? "lg:col-span-2" : "lg:col-span-full"}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Inventario</p>
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Productos
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {filteredProducts.length} resultados
                    {search && ` para "${search}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm text-gray-500 font-medium">Página</span>
                  <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {currentPage}
                  </span>
                  <span className="text-sm text-gray-400">/</span>
                  <span className="text-sm text-gray-600 font-semibold">{totalPages}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200/50 bg-gray-50/50">
                <div>
                  <p className="text-sm font-bold text-gray-900">Filtros Activos</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {filterSummary}, mostrando {sortedProducts.length} de {products.length}
                  </p>
                </div>
                <button
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
                >
                  {filtersOpen ? "Ocultar" : "Mostrar"} filtros
                  <svg
                    className={`w-4 h-4 transform transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {filterChips.length > 0 && (
                <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-gray-200/50 bg-indigo-50/30">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={chip.clear}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      {chip.label}
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-xs font-bold text-gray-500 hover:text-indigo-700 transition-colors px-2"
                  >
                    Limpiar todo
                  </button>
                </div>
              )}

              {filtersOpen && (
                <>
                  <div className="flex flex-wrap items-center gap-4 p-6 border-b border-gray-200/50 bg-gray-50/30">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o categoría"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="flex-1 min-w-[220px] px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 font-medium px-4 py-3 bg-white rounded-xl border border-gray-300 hover:border-indigo-300 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLowStock}
                        onChange={(e) => {
                          setShowLowStock(e.target.checked)
                          setCurrentPage(1)
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Solo poco stock</span>
                    </label>
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium px-4 py-3 bg-white rounded-xl border border-gray-300 shadow-sm">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                        />
                      </svg>
                      <span>Ordenar</span>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="border-0 focus:ring-0 bg-transparent font-semibold text-gray-900 cursor-pointer"
                      >
                        <option value="recent">Recientes</option>
                        <option value="price-desc">Precio ↓</option>
                        <option value="price-asc">Precio ↑</option>
                        <option value="stock-desc">Stock ↓</option>
                        <option value="stock-asc">Stock ↑</option>
                      </select>
                    </div>
                    <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-all duration-200 ${
                          viewMode === "list"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-inner"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                        Lista
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-all duration-200 ${
                          viewMode === "grid"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-inner"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          />
                        </svg>
                        Tarjetas
                      </button>
                    </div>
                    <button
                      onClick={exportCSV}
                      disabled={!sortedProducts.length}
                      className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2 bg-white shadow-sm transition-all duration-200 hover:shadow"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Exportar CSV
                    </button>
                  </div>

                  {categories.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-indigo-50/30">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        <p className="text-xs uppercase text-gray-600 tracking-wider font-bold">Categorías</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setCategoryFilter("all")
                            setCurrentPage(1)
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                            categoryFilter === "all"
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg scale-105"
                              : "border-gray-200 text-gray-600 hover:border-indigo-200 bg-white hover:shadow-md"
                          }`}
                        >
                          Todas ({products.length})
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setCategoryFilter(category)
                              setCurrentPage(1)
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                              categoryFilter === category
                                ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-indigo-700 shadow-md scale-105"
                                : "border-gray-200 text-gray-600 hover:border-indigo-200 bg-white hover:shadow-md"
                            }`}
                          >
                            {category} ({categoryCounts[category]})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0"></div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 font-medium">Cargando productos...</p>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-700">No encontramos productos</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Ajusta los filtros o crea un nuevo producto {isAdmin && "con el formulario de la izquierda"}.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {isGridView ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                      {paginatedProducts.map((p) => (
                        <article
                          key={p._id}
                          className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 bg-white relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex flex-col gap-5">
                            <div className="flex items-start gap-4">
                              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-gray-100 group-hover:ring-indigo-200 transition-all duration-300 group-hover:scale-105">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl || "/placeholder.svg"}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg
                                    className="w-10 h-10 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                                  <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 font-semibold">
                                    {p.category}
                                  </span>
                                  {p.stock <= 5 && (
                                    <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Bajo stock
                                    </span>
                                  )}
                                </div>
                                {p.description && (
                                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{p.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {p.updatedAt
                                    ? new Date(p.updatedAt).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div>
                                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                  ${Number(p.price).toFixed(2)}
                                </p>
                                <p
                                  className={`text-sm font-bold mt-1 flex items-center gap-1 ${
                                    p.stock > 0 ? "text-emerald-600" : "text-red-600"
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                    />
                                  </svg>
                                  Stock: {p.stock}
                                </p>
                              </div>
                              {isAdmin && (
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleEdit(p)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => openRestockModal(p)}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    Reabastecer
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(p._id)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto p-6">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gradient-to-r from-slate-50 to-indigo-50">
                          <tr>
                            <th className="text-left font-bold px-6 py-4 text-gray-700 uppercase tracking-wider text-xs">
                              Producto
                            </th>
                            <th className="text-left font-bold px-6 py-4 text-gray-700 uppercase tracking-wider text-xs">
                              Precio
                            </th>
                            <th className="text-left font-bold px-6 py-4 text-gray-700 uppercase tracking-wider text-xs">
                              Stock
                            </th>
                            {isAdmin && (
                              <th className="text-left font-bold px-6 py-4 text-gray-700 uppercase tracking-wider text-xs">
                                Acciones
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {paginatedProducts.map((p) => (
                            <tr
                              key={p._id}
                              className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-gray-100">
                                    {p.imageUrl ? (
                                      <img
                                        src={p.imageUrl || "/placeholder.svg"}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{p.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{p.category}</p>
                                    {p.description && (
                                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                  ${Number(p.price).toFixed(2)}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                    p.stock > 5
                                      ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200"
                                      : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {p.stock} uds.
                                </span>
                              </td>
                              {isAdmin && (
                                <td className="px-6 py-4 space-x-3 whitespace-nowrap">
                                  <button
                                    onClick={() => handleEdit(p)}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => openRestockModal(p)}
                                    className="text-emerald-600 hover:text-emerald-800 font-bold transition-colors"
                                  >
                                    Reabastecer
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(p._id)}
                                    className="text-red-600 hover:text-red-800 font-bold transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-200/50 px-6 py-5 text-sm bg-gradient-to-r from-gray-50/50 to-indigo-50/30">
                    <span className="text-gray-600 font-medium">
                      Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1} -{" "}
                      {Math.min(currentPage * PRODUCTS_PER_PAGE, sortedProducts.length)} de {sortedProducts.length}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={`px-5 py-2.5 rounded-xl border-2 font-semibold transition-all duration-200 flex items-center gap-2 ${
                          currentPage === 1
                            ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                            : "text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 bg-white shadow-sm hover:shadow"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Anterior
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className={`px-5 py-2.5 rounded-xl border-2 font-semibold transition-all duration-200 flex items-center gap-2 ${
                          currentPage === totalPages
                            ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                            : "text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 bg-white shadow-sm hover:shadow"
                        }`}
                      >
                        Siguiente
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {restockTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse" />
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Reabastecer Inventario</p>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{restockTarget.name}</h3>
              </div>
              <button
                onClick={() => setRestockTarget(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-700 font-medium">
                Stock actual: <span className="font-bold text-emerald-900 text-lg">{restockTarget.stock}</span> uds.
              </p>
            </div>
            <form onSubmit={handleRestock} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad a agregar</label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 font-semibold text-lg"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockTarget(null)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
                  disabled={restockLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {restockLoading ? "Actualizando..." : "Actualizar inventario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
