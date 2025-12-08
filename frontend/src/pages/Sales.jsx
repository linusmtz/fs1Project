"use client"

import { useContext, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import axiosClient from "../api/axiosClient"
import { AuthContext } from "../context/AuthContext"
import Alert from "../components/Alert"
import StatCard from "../components/StatCard"

const SALES_PER_PAGE = 5

export default function Sales() {
  const { auth } = useContext(AuthContext)
  const isAdmin = auth.user?.role === "admin"
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [composerOpen, setComposerOpen] = useState(true)
  const [saleItems, setSaleItems] = useState([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedSaleId, setExpandedSaleId] = useState(null)

  const fetchSales = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await axiosClient.get("/sales")
      setSales(res.data)
      setCurrentPage(1)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar ventas")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const res = await axiosClient.get("/products")
      setProducts(res.data.filter((p) => p.stock > 0))
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar productos")
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchProducts()
  }, [])

  const addItemToSale = () => {
    if (!selectedProduct || quantity < 1) {
      setError("Selecciona un producto y una cantidad válida")
      return
    }

    const product = products.find((p) => p._id === selectedProduct)
    if (!product) {
      setError("Producto no encontrado")
      return
    }

    if (product.stock < quantity) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`)
      return
    }

    const existingItemIndex = saleItems.findIndex((item) => item.product === selectedProduct)

    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems]
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity

      if (product.stock < newQuantity) {
        setError(`Stock insuficiente. Disponible: ${product.stock}`)
        return
      }

      updatedItems[existingItemIndex].quantity = newQuantity
      setSaleItems(updatedItems)
    } else {
      setSaleItems([
        ...saleItems,
        {
          product: selectedProduct,
          quantity,
        },
      ])
    }

    setSelectedProduct("")
    setQuantity(1)
    setError("")
  }

  const removeItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const createSale = async () => {
    if (saleItems.length === 0) {
      setError("Agrega al menos un producto a la venta")
      return
    }

    try {
      setError("")
      setSuccess("")
      await axiosClient.post("/sales", { items: saleItems })
      setSuccess("Venta creada exitosamente")
      setSaleItems([])
      fetchSales()
      fetchProducts()
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : err.response?.data?.message || "Error al crear venta"
      setError(errorMsg)
    }
  }

  const getTotal = () => {
    return saleItems.reduce((total, item) => {
      const product = products.find((p) => p._id === item.product)
      if (!product) return total
      return total + product.price * item.quantity
    }, 0)
  }

  const totalPages = Math.max(1, Math.ceil(sales.length / SALES_PER_PAGE))
  const paginatedSales = sales.slice((currentPage - 1) * SALES_PER_PAGE, currentPage * SALES_PER_PAGE)

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total || 0), 0)
  const bestSeller = (() => {
    const map = {}
    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const key = item.product?._id || item.product
        if (!key) return
        map[key] = {
          name: item.product?.name || "Producto",
          total: (map[key]?.total || 0) + item.quantity,
        }
      })
    })
    const sorted = Object.values(map).sort((a, b) => b.total - a.total)
    return sorted[0]
  })()

  const kpiCards = [
    {
      label: "Ingresos totales",
      value: `$${totalRevenue.toFixed(2)}`,
      helper: "Acumulado histórico",
    },
    {
      label: "Ventas registradas",
      value: sales.length,
      helper: "Operaciones totales",
    },
    {
      label: "Producto destacado",
      value: bestSeller ? bestSeller.name : "Sin datos",
      helper: bestSeller ? `${bestSeller.total} unidades` : "Aún no hay ventas",
    },
  ]
  const hasSales = sales.length > 0

  const scrollToComposer = () => {
    setComposerOpen(true)
    requestAnimationFrame(() => {
      document.getElementById("sale-composer")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-all duration-300 group"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">Volver al Dashboard</span>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ventas
            </h1>
            <div className="hidden sm:flex items-center space-x-4 text-sm font-medium">
              <Link to="/products" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                Productos
              </Link>
              {isAdmin && (
                <Link to="/users" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                  Usuarios
                </Link>
              )}
              {isAdmin && (
                <Link to="/audit" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                  Auditoría
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Resumen de ventas</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Panel de ventas</h2>
            <p className="text-gray-600 text-lg">
              Controla tus ingresos y registra nuevas ventas sin perder de vista el historial.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={scrollToComposer}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar venta</span>
            </button>
            <button
              onClick={() => setComposerOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-white border-2 border-indigo-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {composerOpen ? "Ocultar panel" : "Mostrar panel"}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpiCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 space-y-6">
            <Alert variant="success" message={success} onClose={() => setSuccess("")} />
            <Alert variant="error" message={error} onClose={() => setError("")} />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
                </div>
              </div>
            ) : !hasSales ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-dashed border-gray-300 text-center">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aún no registras ventas</h3>
                <p className="text-gray-600 text-lg">
                  Usa el panel lateral para crear tu primera venta y comenzar a ver el historial aquí.
                </p>
              </div>
            ) : (
              <section className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Historial</p>
                    <h3 className="text-2xl font-bold text-gray-900">Últimas ventas</h3>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-600">Página</span>
                    <span className="px-3 py-1 bg-white rounded-lg font-bold text-indigo-600 shadow-sm">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {paginatedSales.map((sale) => {
                    const isExpanded = expandedSaleId === sale._id
                    return (
                      <article key={sale._id}>
                        <button
                          onClick={() => setExpandedSaleId((prev) => (prev === sale._id ? null : sale._id))}
                          className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                              <svg
                                className="w-6 h-6 text-indigo-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-indigo-600 mb-1">
                                Venta #{sale._id?.slice(-6) || "N/A"}
                              </p>
                              <p className="text-lg font-bold text-gray-900">{sale.user?.name || "Usuario"}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Total</p>
                              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                ${Number(sale.total).toFixed(2)}
                              </p>
                            </div>
                            <span
                              className={`transform transition-all duration-300 ${
                                isExpanded ? "rotate-180 text-indigo-600" : "text-gray-400 group-hover:text-indigo-400"
                              }`}
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-6 pt-3 bg-gradient-to-br from-slate-50 to-indigo-50 border-t border-indigo-100">
                            <div className="space-y-3">
                              {sale.items?.map((item) => (
                                <div
                                  key={item._id}
                                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                                      <svg
                                        className="w-5 h-5 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">{item.product?.name || "Producto"}</p>
                                      <p className="text-sm text-gray-500">
                                        Cantidad: <span className="font-semibold text-indigo-600">{item.quantity}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">${Number(item.price).toFixed(2)} c/u</p>
                                    <p className="text-lg font-bold text-indigo-600">
                                      ${(Number(item.price) * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between bg-gray-50 border-t border-gray-200 px-6 py-4 text-sm">
                  <span className="text-gray-600 font-medium">
                    Mostrando{" "}
                    <span className="text-indigo-600 font-bold">{(currentPage - 1) * SALES_PER_PAGE + 1}</span> -{" "}
                    <span className="text-indigo-600 font-bold">
                      {Math.min(currentPage * SALES_PER_PAGE, sales.length)}
                    </span>{" "}
                    de <span className="text-indigo-600 font-bold">{sales.length}</span>
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                        currentPage === 1
                          ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                          : "text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-105"
                      }`}
                    >
                      Anterior
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                        currentPage === totalPages
                          ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                          : "text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-105"
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </section>
            )}
          </section>

          <aside className="space-y-6">
            <div
              id="sale-composer"
              className="bg-white rounded-2xl border-2 border-indigo-200 shadow-xl p-6 space-y-5 sticky top-24"
            >
              <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-1">Nuevo ticket</p>
                  <h3 className="text-2xl font-bold text-gray-900">Crear venta</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold text-indigo-600">{products.length}</span> productos disponibles
                  </p>
                </div>
                <button
                  onClick={() => setComposerOpen((prev) => !prev)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-300"
                >
                  <svg
                    className={`w-6 h-6 transition-transform duration-300 ${composerOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {composerOpen && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full font-bold text-sm">
                        1
                      </div>
                      <p className="text-sm font-bold text-gray-700">Seleccionar producto</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Producto</label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                          disabled={loadingProducts}
                        >
                          <option value="">Selecciona un producto</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} · Stock {p.stock} · ${Number(p.price).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number.parseInt(e.target.value, 10) || 1)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={addItemToSale}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t-2 border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full font-bold text-sm">
                        2
                      </div>
                      <p className="text-sm font-bold text-gray-700">Confirmar items</p>
                    </div>
                    {saleItems.length === 0 ? (
                      <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        <p className="text-sm text-gray-600 font-medium">No hay productos en la venta</p>
                        <p className="text-xs text-gray-500 mt-1">Agrega al menos uno para continuar</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {saleItems.map((item, index) => {
                          const product = products.find((p) => p._id === item.product)
                          if (!product) return null
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 group hover:shadow-md transition-all duration-300"
                            >
                              <div className="flex-1">
                                <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                                <p className="text-xs text-gray-600">
                                  {item.quantity} × ${Number(product.price).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-indigo-600">
                                  ${(item.quantity * Number(product.price)).toFixed(2)}
                                </p>
                                <button
                                  onClick={() => removeItem(index)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-300"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t-2 border-gray-100">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                      <span className="text-sm font-bold text-gray-700">Total de la venta</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        ${getTotal().toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={createSale}
                      disabled={saleItems.length === 0}
                      className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
                        saleItems.length === 0
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-105"
                      }`}
                    >
                      {saleItems.length === 0 ? "Agrega productos" : "Confirmar venta"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
