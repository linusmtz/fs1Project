"use client"

import { useContext, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import axiosClient from "../api/axiosClient"

export default function Dashboard() {
  const { auth, logout } = useContext(AuthContext)
  const user = auth.user
  const isAdmin = user?.role === "admin"
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState(false)
  const [insightMode, setInsightMode] = useState("detallado")

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError("")
        const { data } = await axiosClient.get("/analytics/summary")
        setSummary(data)
      } catch (err) {
        setError(err.response?.data?.message || "No se pudo cargar el resumen")
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  const trend = summary?.sales?.trend ?? []
  const bestSellers = summary?.sales?.bestSellers ?? []
  const lowStockProducts = summary?.products?.lowStockProducts ?? []
  const recentSales = summary?.sales?.recentSales ?? []
  const inventoryValue = summary?.products?.inventoryValue ?? 0
  const totalInventoryUnits = summary?.products?.totalInventoryUnits ?? 0
  const lowStockItems = summary?.products?.lowStockItems ?? 0
  const totalRevenue = summary?.sales?.totalRevenue ?? 0
  const totalSales = summary?.sales?.totalSales ?? 0
  const totalProducts = summary?.products?.total ?? 0

  const revenueWeek = useMemo(() => trend.reduce((acc, day) => acc + day.totalRevenue, 0), [trend])

  const trendDelta = useMemo(() => {
    if (trend.length < 2) return 0
    const first = trend[0].totalRevenue || 0
    const last = trend[trend.length - 1].totalRevenue || 0
    if (!first) return last ? 100 : 0
    return ((last - first) / first) * 100
  }, [trend])

  const downloadSalesReport = async () => {
    try {
      setExporting(true)
      const response = await axiosClient.get("/sales/export", { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      const date = new Date().toISOString().split("T")[0]
      link.href = url
      link.setAttribute("download", `ventas-${date}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo exportar las ventas")
    } finally {
      setExporting(false)
    }
  }

  const stats = [
    {
      label: "Ingresos totales",
      value: summary ? `$${totalRevenue.toFixed(2)}` : "--",
      accent: "text-emerald-600",
    },
    {
      label: "Ventas registradas",
      value: summary ? totalSales : "--",
      accent: "text-indigo-600",
    },
    {
      label: "Productos en inventario",
      value: summary ? totalProducts : "--",
      accent: "text-blue-600",
    },
    {
      label: "Ítems con poco stock",
      value: summary ? summary.products.lowStockItems : "--",
      accent: "text-amber-600",
    },
  ]

  const isCompactView = insightMode === "resumen"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Sistema de Gestión
                  </h1>
                </div>
                <div className="hidden md:flex space-x-1">
                  <Link
                    to="/products"
                    className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Productos
                  </Link>
                  <Link
                    to="/sales"
                    className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Ventas
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/users"
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Usuarios
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/audit"
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Auditoría
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-full border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-500/30 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-full"></div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Panel Principal
              </h2>
            </div>
            <p className="text-gray-600 text-lg mb-6">
              Bienvenido de vuelta,{" "}
              <span className="font-semibold text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text">
                {user?.name || user?.email}
              </span>
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadSalesReport}
                disabled={exporting}
                className="inline-flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-white disabled:opacity-50 transition-all duration-200 font-medium group"
              >
                {exporting ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                    <span>Exportando...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                      />
                    </svg>
                    <span>Exportar ventas (CSV)</span>
                  </>
                )}
              </button>
              <Link
                to="/sales"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 font-medium group hover:scale-105"
              >
                <span>Registrar venta</span>
                <svg
                  className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Vista:</span>
              <div className="inline-flex bg-white/90 backdrop-blur border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {["resumen", "detallado"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInsightMode(mode)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      insightMode === mode
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {mode === "resumen" ? "Compacto" : "Detallado"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-xl mb-8 shadow-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 00-1.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              {
                label: "Ingresos totales",
                value: summary ? `$${totalRevenue.toFixed(2)}` : "--",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                gradient: "from-emerald-500 to-teal-600",
                bg: "from-emerald-50 to-teal-50/50",
                iconBg: "from-emerald-500/10 to-teal-500/10",
              },
              {
                label: "Ventas registradas",
                value: summary ? totalSales : "--",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                ),
                gradient: "from-indigo-500 to-blue-600",
                bg: "from-indigo-50 to-blue-50/50",
                iconBg: "from-indigo-500/10 to-blue-500/10",
              },
              {
                label: "Productos en inventario",
                value: summary ? totalProducts : "--",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                ),
                gradient: "from-blue-500 to-cyan-600",
                bg: "from-blue-50 to-cyan-50/50",
                iconBg: "from-blue-500/10 to-cyan-500/10",
              },
              {
                label: "Ítems con poco stock",
                value: summary ? summary.products.lowStockItems : "--",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ),
                gradient: "from-amber-500 to-orange-600",
                bg: "from-amber-50 to-orange-50/50",
                iconBg: "from-amber-500/10 to-orange-500/10",
              },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className={`bg-gradient-to-br ${stat.bg} backdrop-blur rounded-2xl shadow-md hover:shadow-xl border border-white/60 p-6 transition-all duration-300 hover:scale-105 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.iconBg} text-transparent bg-clip-text`}>
                    <div className={`bg-gradient-to-br ${stat.gradient} text-white rounded-lg p-2`}>{stat.icon}</div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                <div className="animate-ping absolute inset-0 h-16 w-16 border-4 border-indigo-400 rounded-full opacity-20"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Cargando datos...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/50 p-6 space-y-5 xl:col-span-2 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Productos</h3>
                    </div>
                    <Link
                      to="/products"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                    >
                      Ver todos →
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl px-4 py-3 border border-blue-100">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">Valor del inventario:</span>
                    <span className="text-gray-900 font-bold text-lg ml-auto">${inventoryValue.toFixed(2)}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-amber-100 rounded-lg">
                          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Alertas de stock</p>
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                        {lowStockItems}
                      </p>
                      <p className="text-xs text-gray-600">Productos por debajo de 5 unidades</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <svg
                            className="w-4 h-4 text-indigo-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Inventario total</p>
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        {totalInventoryUnits}
                      </p>
                      <p className="text-xs text-gray-600">Unidades disponibles</p>
                    </div>
                  </div>
                </div>

                {!isCompactView && (
                  <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/50 p-6 space-y-4 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                          <svg
                            className="w-6 h-6 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Top ventas</h3>
                      </div>
                      <Link
                        to="/sales"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                      >
                        Ver ventas →
                      </Link>
                    </div>
                    <ul className="space-y-3">
                      {bestSellers.length ? (
                        bestSellers.map((item, idx) => (
                          <li
                            key={item.productId}
                            className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-0.5">{item.quantity} uds.</p>
                              <p className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                ${Number(item.revenue).toFixed(2)}
                              </p>
                            </div>
                          </li>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">Sin datos suficientes.</p>
                        </div>
                      )}
                    </ul>
                  </div>
                )}

                <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 backdrop-blur rounded-2xl shadow-lg border border-indigo-200/50 p-6 space-y-4 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Acciones rápidas</h3>
                  </div>
                  <p className="text-sm text-gray-600">Accede a las secciones principales desde un solo lugar.</p>
                  <div className="space-y-3">
                    <Link
                      to="/products"
                      className="flex items-center justify-between w-full bg-white/80 backdrop-blur border border-indigo-200 text-gray-700 font-semibold py-3.5 px-4 rounded-xl hover:bg-white hover:shadow-md hover:border-indigo-300 transition-all duration-200 group"
                    >
                      <span>Gestionar productos</span>
                      <svg
                        className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link
                      to="/sales"
                      className="flex items-center justify-between w-full bg-white/80 backdrop-blur border border-indigo-200 text-gray-700 font-semibold py-3.5 px-4 rounded-xl hover:bg-white hover:shadow-md hover:border-indigo-300 transition-all duration-200 group"
                    >
                      <span>Registrar venta</span>
                      <svg
                        className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {isCompactView ? (
                <div className="grid grid-cols-1 gap-6">
                  <section className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/50 p-7 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Resumen ejecutivo</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        { icon: "📦", text: `Inventario disponible: ${totalInventoryUnits} unidades.` },
                        { icon: "💰", text: `Ingresos de la última semana: $${revenueWeek.toFixed(2)}.` },
                        { icon: "⚠️", text: `Productos críticos: ${lowStockItems} con stock bajo.` },
                        { icon: "🛒", text: `Ventas registradas: ${totalSales} operaciones.` },
                      ].map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                        >
                          <span className="text-xl">{item.icon}</span>
                          <span className="flex-1 leading-relaxed">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/50 p-7 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
                              <svg
                                className="w-5 h-5 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Tendencia semanal
                            </p>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">Ingresos últimos 7 días</h3>
                        </div>
                        {trend.length ? (
                          <span
                            className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                              trendDelta >= 0
                                ? "text-emerald-700 bg-gradient-to-r from-emerald-100 to-teal-100"
                                : "text-rose-700 bg-gradient-to-r from-rose-100 to-red-100"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d={
                                  trendDelta >= 0
                                    ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                    : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                }
                                clipRule="evenodd"
                              />
                            </svg>
                            {trendDelta.toFixed(1)}%
                          </span>
                        ) : null}
                      </div>
                      {trend.length ? (
                        <div className="space-y-5">
                          <div className="flex items-end justify-between space-x-3 h-40 bg-gradient-to-t from-gray-50 to-transparent rounded-xl p-4 border border-gray-100">
                            {trend.map((day, idx) => {
                              const maxRevenue = Math.max(...trend.map((d) => d.totalRevenue || 0), 1)
                              const height = (day.totalRevenue / maxRevenue) * 100 || 5
                              const date = new Date(day.date)
                              const label = date.toLocaleDateString("es-ES", {
                                weekday: "short",
                              })
                              return (
                                <div key={day.date} className="flex-1 flex flex-col items-center group">
                                  <div className="relative w-full flex flex-col items-center">
                                    <div
                                      className="w-full max-w-[32px] rounded-t-xl bg-gradient-to-t from-indigo-600 via-indigo-500 to-violet-400 hover:from-indigo-700 hover:via-indigo-600 hover:to-violet-500 transition-all duration-300 group-hover:scale-110 shadow-lg shadow-indigo-500/30"
                                      style={{ height: `${Math.max(height, 10)}%` }}
                                      title={`$${day.totalRevenue.toFixed(2)}`}
                                    ></div>
                                    <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded-lg shadow-md whitespace-nowrap">
                                      ${day.totalRevenue.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-3 uppercase font-semibold">{label}</p>
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                              <span className="text-sm text-gray-600">Promedio diario:</span>
                              <span className="font-bold text-gray-900">
                                ${(trend.reduce((acc, day) => acc + day.totalRevenue, 0) / trend.length).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-violet-600"></div>
                              <span className="text-sm text-gray-600">Total semana:</span>
                              <span className="font-bold text-gray-900">
                                ${trend.reduce((acc, day) => acc + day.totalRevenue, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <svg
                            className="w-16 h-16 mx-auto text-gray-300 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <p className="text-sm text-gray-500">Sin ventas en los últimos días.</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/50 p-7 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                              <svg
                                className="w-5 h-5 text-amber-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Stock crítico
                            </p>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">Productos con menos inventario</h3>
                        </div>
                        <Link
                          to="/products"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors flex items-center gap-1"
                        >
                          <span>Reabastecer</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                      {lowStockProducts.length ? (
                        <ul className="space-y-3">
                          {lowStockProducts.map((product) => (
                            <li
                              key={product._id}
                              className="flex items-center justify-between bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                                  <svg
                                    className="w-5 h-5 text-amber-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
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
                                  <p className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                                    {product.name}
                                  </p>
                                  <p className="text-sm text-gray-600">{product.category}</p>
                                </div>
                              </div>
                              <span className="px-4 py-2 text-sm font-bold text-amber-800 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full shadow-md">
                                {product.stock} uds.
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">👌</div>
                          <p className="text-sm font-medium text-gray-700">¡No tienes productos críticos!</p>
                          <p className="text-xs text-gray-500 mt-1">Todo el inventario está en buen estado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/50 p-7 lg:col-span-3 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                              <svg
                                className="w-5 h-5 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Actividad reciente
                            </p>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">Últimas ventas</h3>
                        </div>
                        <Link
                          to="/sales"
                          className="text-indigo-600 hover:text-indigo-700 hover:underline text-sm font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>Ir a ventas</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>

                      {recentSales.length ? (
                        <div className="space-y-4">
                          {recentSales.map((sale) => (
                            <div
                              key={sale._id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
                            >
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl">
                                  <svg
                                    className="w-6 h-6 text-emerald-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="text-sm font-bold text-gray-900">Venta #{sale._id.slice(-6)}</p>
                                    <span className="text-xs text-gray-400">•</span>
                                    <p className="text-sm text-gray-500">
                                      {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">
                                    Por:{" "}
                                    <span className="font-semibold text-gray-700">
                                      {sale.user?.name || sale.user?.email || "Usuario desconocido"}
                                    </span>
                                  </p>
                                  {sale.items && sale.items.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {sale.items.slice(0, 3).map((item, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium"
                                        >
                                          <span>{item.product?.name || "Producto"}</span>
                                          <span className="text-indigo-400">×</span>
                                          <span className="font-bold">{item.quantity}</span>
                                        </span>
                                      ))}
                                      {sale.items.length > 3 && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                                          +{sale.items.length - 3} más
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                                <div className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
                                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                                    ${Number(sale.totalAmount).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <svg
                            className="w-20 h-20 mx-auto text-gray-300 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <p className="text-sm font-medium text-gray-700">No hay ventas registradas.</p>
                          <p className="text-xs text-gray-500 mt-1">Las ventas recientes aparecerán aquí</p>
                        </div>
                      )}
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
