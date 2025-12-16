"use client"

import { useContext, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axiosClient from "../api/axiosClient"
import { AuthContext } from "../context/AuthContext"
import Alert from "../components/Alert"
import StatCard from "../components/StatCard"
import Navbar from "../components/Navbar"

const ACTION_STYLES = {
  PRODUCT_CREATED: { label: "Producto creado", badge: "from-emerald-500 to-teal-500" },
  PRODUCT_UPDATED: { label: "Producto editado", badge: "from-indigo-500 to-blue-500" },
  PRODUCT_DELETED: { label: "Producto eliminado", badge: "from-rose-500 to-red-500" },
  PRODUCT_RESTOCKED: { label: "Restock aplicado", badge: "from-amber-500 to-orange-500" },
  USER_CREATED: { label: "Usuario creado", badge: "from-purple-500 to-indigo-500" },
  USER_UPDATED: { label: "Usuario actualizado", badge: "from-blue-500 to-sky-500" },
  USER_STATUS_CHANGED: { label: "Estado de usuario", badge: "from-slate-500 to-gray-600" },
  SALE_CREATED: { label: "Venta registrada", badge: "from-pink-500 to-fuchsia-500" },
}

const LIMIT_OPTIONS = [25, 50, 100, 150]

export default function Audit() {
  const { auth } = useContext(AuthContext)
  const isAdmin = auth.user?.role === "admin"
  const navigate = useNavigate()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [limit, setLimit] = useState(50)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (auth.user && !isAdmin) {
      navigate("/")
    }
  }, [auth.user, isAdmin, navigate])

  useEffect(() => {
    if (!isAdmin) return
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError("")
        const params = { limit }
        if (actionFilter !== "all") params.action = actionFilter
        const { data } = await axiosClient.get("/audit", { params })
        setLogs(data)
      } catch (err) {
        setError(err.response?.data?.message || "No se pudo cargar la auditoría")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [actionFilter, limit, isAdmin])

  const filteredLogs = useMemo(() => {
    if (!search) return logs
    return logs.filter((log) => {
      const haystack = `${log.details || ""} ${log.entityName || ""} ${log.action} ${log.performedBy?.name || ""} ${
        log.performedBy?.email || ""
      }`
        .toLowerCase()
        .trim()
      return haystack.includes(search.toLowerCase().trim())
    })
  }, [logs, search])

  const timeline = useMemo(() => {
    const map = new Map()
    const orderedGroups = []
    filteredLogs.forEach((log) => {
      const label = new Date(log.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      if (!map.has(label)) {
        map.set(label, [])
        orderedGroups.push({ label, entries: map.get(label) })
      }
      map.get(label).push(log)
    })
    return orderedGroups
  }, [filteredLogs])

  const logStats = useMemo(() => {
    const last24h = filteredLogs.filter((log) => Date.now() - new Date(log.createdAt).getTime() <= 86400000).length
    const actorSet = new Set()
    filteredLogs.forEach((log) => {
      const actorId =
        typeof log.performedBy === "object" ? log.performedBy?._id?.toString() : log.performedBy?.toString()
      if (actorId) actorSet.add(actorId)
    })
    const productEvents = filteredLogs.filter((log) => log.entityType === "product").length
    return [
      { label: "Eventos recientes", value: filteredLogs.length, helper: "Resultados después de los filtros" },
      { label: "Últimas 24h", value: last24h, helper: "Movimientos del último día" },
      { label: "Usuarios involucrados", value: actorSet.size, helper: "Personas que realizaron acciones" },
      { label: "Eventos de inventario", value: productEvents, helper: "Relación con productos" },
    ]
  }, [filteredLogs])

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30">
      <Navbar title="Registro de actividades" subtitle="Auditoría" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-10 bg-gradient-to-b from-indigo-600 to-fuchsia-600 rounded-full"></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Transparencia total</p>
                <h2 className="text-3xl font-bold text-gray-900">Bitácora administrativa</h2>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Monitorea movimientos clave del sistema. Cada vez que alguien registra ventas, edita productos o crea
              cuentas, queda un rastro para mantener el control del negocio.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {logStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
            ))}
          </div>
        </header>

        <Alert variant="error" message={error} onClose={() => setError("")} />

        <section className="bg-white/90 rounded-2xl border border-gray-200/60 shadow-xl p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Tipo de evento</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-48 mt-1 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  {Object.entries(ACTION_STYLES).map(([key, config]) => (
                    <option value={key} key={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Cantidad mostrada</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-32 mt-1 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {LIMIT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item} eventos
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Buscar</label>
                <div className="relative mt-1">
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                    />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por persona, acción o entidad..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setSearch("")}
                className="h-11 px-4 mt-6 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-lg font-semibold text-gray-800 mb-2">Sin eventos con los filtros actuales</p>
                <p className="text-gray-500">Amplía la búsqueda o incrementa el límite de resultados.</p>
              </div>
            ) : (
              timeline.map(({ label: dateLabel, entries }) => (
                <div key={dateLabel}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 animate-pulse"></div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{dateLabel}</p>
                    <span className="text-xs text-gray-400">({entries.length} eventos)</span>
                  </div>
                  <div className="space-y-4">
                    {entries.map((log) => {
                      const actionConfig = ACTION_STYLES[log.action] || {
                        label: log.action,
                        badge: "from-slate-500 to-gray-500",
                      }
                      return (
                        <article
                          key={log._id}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full text-white bg-gradient-to-r ${actionConfig.badge}`}
                              >
                                {actionConfig.label}
                              </span>
                              <p className="text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {log.entityName && (
                              <p className="text-sm font-semibold text-gray-700">{log.entityName}</p>
                            )}
                          </div>
                          <p className="text-gray-700">{log.details || "Acción registrada"}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-semibold">
                                {(log.performedBy?.name || log.performedBy?.email || "S").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-gray-900 font-semibold">
                                  {log.performedBy?.name || log.performedBy?.email || "Sistema"}
                                </p>
                                <p className="text-xs text-gray-500">{log.performedBy?.email || "Acción automática"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase tracking-wider text-gray-500">Entidad</span>
                              <span className="px-3 py-1 rounded-lg border border-gray-200 text-gray-700 font-medium">
                                {log.entityType}
                              </span>
                            </div>
                            {log.metadata?.quantity && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs uppercase tracking-wider text-gray-500">Cantidad</span>
                                <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold">
                                  +{log.metadata.quantity}
                                </span>
                              </div>
                            )}
                            {log.metadata?.total && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs uppercase tracking-wider text-gray-500">Total</span>
                                <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
                                  ${Number(log.metadata.total).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
