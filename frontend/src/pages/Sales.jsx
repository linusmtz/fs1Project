import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";

const SALES_PER_PAGE = 5;

export default function Sales() {
  const { auth } = useContext(AuthContext);
  const isAdmin = auth.user?.role === "admin";
  
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  
  // Filtros de búsqueda
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    userId: "",
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/sales");
      setSales(res.data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await axiosClient.get("/products");
      setProducts(res.data.filter((p) => p.stock > 0));
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar productos");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const addItemToSale = () => {
    if (!selectedProduct) {
      setError("Selecciona un producto");
      return;
    }
    
    if (!quantity || quantity < 1) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    const product = products.find((p) => p._id === selectedProduct);
    if (!product) {
      setError("Producto no encontrado");
      return;
    }

    if (product.stock < quantity) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const existingItemIndex = saleItems.findIndex((item) => item.product === selectedProduct);

    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;

      if (product.stock < newQuantity) {
        setError(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }

      updatedItems[existingItemIndex].quantity = newQuantity;
      setSaleItems(updatedItems);
    } else {
      setSaleItems([
        ...saleItems,
        {
          product: selectedProduct,
          quantity,
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity(1);
    setError("");
  };

  const removeItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index, newQuantity) => {
    const item = saleItems[index];
    const product = products.find((p) => p._id === item.product);
    
    if (!product) {
      setError("Producto no encontrado");
      return;
    }

    // Si es string vacío, permitir que se borre temporalmente
    if (newQuantity === "") {
      const updatedItems = [...saleItems];
      updatedItems[index] = { ...updatedItems[index], quantity: "" };
      setSaleItems(updatedItems);
      setError("");
      return;
    }

    const quantity = parseInt(newQuantity, 10);
    
    if (isNaN(quantity) || quantity < 1) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    // Calcular stock disponible considerando otros items del mismo producto en la venta
    const otherItemsQuantity = saleItems
      .filter((it, i) => i !== index && it.product === item.product)
      .reduce((sum, it) => sum + (it.quantity || 0), 0);
    
    const availableStock = product.stock - otherItemsQuantity;

    if (quantity > availableStock) {
      setError(`Stock insuficiente. Disponible: ${availableStock} (considerando otros items en la venta)`);
      return;
    }

    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], quantity };
    setSaleItems(updatedItems);
    setError("");
  };

  const createSale = async () => {
    if (saleItems.length === 0) {
      setError("Agrega al menos un producto a la venta");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axiosClient.post("/sales", { items: saleItems });
      setSuccess("¡Venta creada exitosamente! 🎉");
      setSaleItems([]);
      setShowForm(false);
      fetchSales();
      fetchProducts();
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : err.response?.data?.message || "Error al crear venta";
      setError(errorMsg);
    }
  };

  const getTotal = () => {
    return saleItems.reduce((total, item) => {
      const product = products.find((p) => p._id === item.product);
      if (!product) return total;
      return total + product.price * item.quantity;
    }, 0);
  };

  // Obtener usuarios únicos de las ventas
  const uniqueUsers = Array.from(
    new Map(sales.map(sale => [sale.user?._id || sale.user, sale.user])).values()
  ).filter(Boolean);

  // Validar filtros
  const validateFilters = () => {
    const errors = {};

    // Validar rango de fechas
    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      if (fromDate > toDate) {
        errors.dateRange = "La fecha 'desde' no puede ser mayor que la fecha 'hasta'";
      }
    }

    // Validar montos
    if (filters.amountMin) {
      const minAmount = parseFloat(filters.amountMin);
      if (isNaN(minAmount) || minAmount < 0) {
        errors.amountMin = "El monto mínimo debe ser un número positivo";
      }
    }

    if (filters.amountMax) {
      const maxAmount = parseFloat(filters.amountMax);
      if (isNaN(maxAmount) || maxAmount < 0) {
        errors.amountMax = "El monto máximo debe ser un número positivo";
      }
    }

    // Validar rango de montos
    if (filters.amountMin && filters.amountMax) {
      const minAmount = parseFloat(filters.amountMin);
      const maxAmount = parseFloat(filters.amountMax);
      if (!isNaN(minAmount) && !isNaN(maxAmount) && minAmount > maxAmount) {
        errors.amountRange = "El monto mínimo no puede ser mayor que el monto máximo";
      }
    }

    return errors;
  };

  const filterErrors = validateFilters();
  const hasFilterErrors = Object.keys(filterErrors).length > 0;

  // Filtrar ventas (solo si no hay errores de validación)
  const filteredSales = hasFilterErrors ? [] : sales.filter((sale) => {
    try {
      // Filtro por fecha desde
      if (filters.dateFrom) {
        const saleDate = new Date(sale.createdAt);
        const fromDate = new Date(filters.dateFrom);
        if (isNaN(saleDate.getTime()) || isNaN(fromDate.getTime())) return false;
        fromDate.setHours(0, 0, 0, 0);
        if (saleDate < fromDate) return false;
      }

      // Filtro por fecha hasta
      if (filters.dateTo) {
        const saleDate = new Date(sale.createdAt);
        const toDate = new Date(filters.dateTo);
        if (isNaN(saleDate.getTime()) || isNaN(toDate.getTime())) return false;
        toDate.setHours(23, 59, 59, 999);
        if (saleDate > toDate) return false;
      }

      // Filtro por monto mínimo
      if (filters.amountMin) {
        const minAmount = parseFloat(filters.amountMin);
        if (isNaN(minAmount) || minAmount < 0) return false;
        const saleTotal = parseFloat(sale.total) || 0;
        if (saleTotal < minAmount) return false;
      }

      // Filtro por monto máximo
      if (filters.amountMax) {
        const maxAmount = parseFloat(filters.amountMax);
        if (isNaN(maxAmount) || maxAmount < 0) return false;
        const saleTotal = parseFloat(sale.total) || 0;
        if (saleTotal > maxAmount) return false;
      }

      // Filtro por usuario
      if (filters.userId) {
        const saleUserId = sale.user?._id || sale.user;
        if (!saleUserId || saleUserId.toString() !== filters.userId.toString()) return false;
      }

      return true;
    } catch (error) {
      console.error("Error filtrando venta:", error);
      return false;
    }
  });

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / SALES_PER_PAGE));
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * SALES_PER_PAGE,
    currentPage * SALES_PER_PAGE
  );

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      userId: "",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
  const bestSeller = (() => {
    const map = {};
    filteredSales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const key = item.product?._id || item.product;
        if (!key) return;
        map[key] = {
          name: item.product?.name || "Producto",
          total: (map[key]?.total || 0) + item.quantity,
        };
      });
    });
    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    return sorted[0];
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navbar title="Registro de ventas" subtitle="Ventas" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Panel de Ventas
            </p>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Registro de Ventas
            </h2>
            <p className="text-gray-600 mt-2 text-lg">
              Visualiza el historial y registra nuevas ventas
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transform flex items-center gap-2"
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Ocultar Formulario</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nueva Venta</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Ingresos Totales</p>
                <p className="text-4xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Ventas Registradas</p>
                <p className="text-4xl font-bold">{sales.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Producto Estrella</p>
                <p className="text-lg font-bold">
                  {bestSeller ? `${bestSeller.name}` : "Sin datos"}
                </p>
                {bestSeller && (
                  <p className="text-sm text-purple-100 mt-1">{bestSeller.total} unidades vendidas</p>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <Alert variant="success" message={success} onClose={() => setSuccess("")} />
        <Alert variant="error" message={error} onClose={() => setError("")} />

        {/* Formulario de Nueva Venta */}
        {showForm && (
          <section className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-gray-200/50 space-y-6 animate-slide-in">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Nueva Venta
                </p>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Arma el Ticket
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm font-semibold text-indigo-700">
                  {products.length} productos disponibles
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Producto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                  disabled={loadingProducts}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} • Stock: {p.stock} • ${Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (isNaN(value) || value < 1) {
                      setQuantity(1);
                      setError("La cantidad debe ser mayor a 0");
                    } else {
                      setQuantity(value);
                      setError(""); // Limpiar error si el valor es válido
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (isNaN(value) || value < 1) {
                      setQuantity(1);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addItemToSale}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transform flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {saleItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Productos en la Venta
                </h4>
                <div className="space-y-3">
                  {saleItems.map((item, index) => {
                    const product = products.find((p) => p._id === item.product);
                    if (!product) return null;
                    return (
                      <div
                        key={`${item.product}-${index}`}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              ${Number(product.price).toFixed(2)} c/u • Stock: {product.stock}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500">Cantidad:</label>
                            <input
                              type="number"
                              min="1"
                              max={product.stock}
                              value={item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "" || (!isNaN(value) && parseInt(value) >= 1)) {
                                  updateItemQuantity(index, value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (isNaN(value) || value < 1) {
                                  updateItemQuantity(index, 1);
                                } else {
                                  // La validación de stock se hace en updateItemQuantity
                                  const otherItemsQuantity = saleItems
                                    .filter((it, i) => i !== index && it.product === item.product)
                                    .reduce((sum, it) => sum + (it.quantity || 0), 0);
                                  const availableStock = product.stock - otherItemsQuantity;
                                  
                                  if (value > availableStock) {
                                    updateItemQuantity(index, availableStock);
                                    setError(`Cantidad ajustada al stock disponible: ${availableStock}`);
                                    setTimeout(() => setError(""), 3000);
                                  }
                                }
                              }}
                              className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-center font-semibold"
                            />
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              ${(Number(product.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                            title="Eliminar producto"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t-2 border-dashed border-gray-300 pt-4 mt-4">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ${getTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={createSale}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Confirmar Venta</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Filtros de Búsqueda */}
        <section className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filtros de Búsqueda</h3>
              <p className="text-sm text-gray-600">Filtra ventas por fecha, monto o usuario</p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>
          
          {/* Mensajes de error de validación */}
          {hasFilterErrors && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">Errores en los filtros:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {filterErrors.dateRange && <li>• {filterErrors.dateRange}</li>}
                    {filterErrors.amountMin && <li>• {filterErrors.amountMin}</li>}
                    {filterErrors.amountMax && <li>• {filterErrors.amountMax}</li>}
                    {filterErrors.amountRange && <li>• {filterErrors.amountRange}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) => {
                  const newDateFrom = e.target.value;
                  setFilters({ ...filters, dateFrom: newDateFrom });
                  setCurrentPage(1);
                }}
                onBlur={(e) => {
                  // Validar que la fecha desde no sea mayor que fecha hasta
                  if (filters.dateTo && e.target.value > filters.dateTo) {
                    setError("La fecha 'desde' no puede ser mayor que la fecha 'hasta'");
                    setTimeout(() => setError(""), 5000);
                  }
                }}
                className={`w-full px-3 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-sm ${
                  filterErrors.dateRange ? "border-red-300 focus:ring-red-500" : "border-gray-200"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => {
                  const newDateTo = e.target.value;
                  setFilters({ ...filters, dateTo: newDateTo });
                  setCurrentPage(1);
                }}
                onBlur={(e) => {
                  // Validar que la fecha hasta no sea menor que fecha desde
                  if (filters.dateFrom && e.target.value < filters.dateFrom) {
                    setError("La fecha 'hasta' no puede ser menor que la fecha 'desde'");
                    setTimeout(() => setError(""), 5000);
                  }
                }}
                className={`w-full px-3 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-sm ${
                  filterErrors.dateRange ? "border-red-300 focus:ring-red-500" : "border-gray-200"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monto Mínimo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={filters.amountMin}
                onChange={(e) => {
                  const value = e.target.value;
                  // Solo permitir números positivos o vacío
                  if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                    setFilters({ ...filters, amountMin: value });
                    setCurrentPage(1);
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  // Validar que no sea negativo
                  if (e.target.value && (isNaN(value) || value < 0)) {
                    setFilters({ ...filters, amountMin: "" });
                    setError("El monto mínimo debe ser un número positivo");
                    setTimeout(() => setError(""), 5000);
                  }
                  // Validar que no sea mayor que monto máximo
                  if (filters.amountMax && value > parseFloat(filters.amountMax)) {
                    setError("El monto mínimo no puede ser mayor que el monto máximo");
                    setTimeout(() => setError(""), 5000);
                  }
                }}
                className={`w-full px-3 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-sm ${
                  filterErrors.amountMin || filterErrors.amountRange ? "border-red-300 focus:ring-red-500" : "border-gray-200"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monto Máximo</label>
              <input
                type="number"
                step="0.01"
                min={filters.amountMin || "0"}
                placeholder="Sin límite"
                value={filters.amountMax}
                onChange={(e) => {
                  const value = e.target.value;
                  // Solo permitir números positivos o vacío
                  if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                    setFilters({ ...filters, amountMax: value });
                    setCurrentPage(1);
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  // Validar que no sea negativo
                  if (e.target.value && (isNaN(value) || value < 0)) {
                    setFilters({ ...filters, amountMax: "" });
                    setError("El monto máximo debe ser un número positivo");
                    setTimeout(() => setError(""), 5000);
                  }
                  // Validar que no sea menor que monto mínimo
                  if (filters.amountMin && value < parseFloat(filters.amountMin)) {
                    setError("El monto máximo no puede ser menor que el monto mínimo");
                    setTimeout(() => setError(""), 5000);
                  }
                }}
                className={`w-full px-3 py-2 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-sm ${
                  filterErrors.amountMax || filterErrors.amountRange ? "border-red-300 focus:ring-red-500" : "border-gray-200"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Gestionado Por</label>
              <select
                value={filters.userId}
                onChange={(e) => {
                  setFilters({ ...filters, userId: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-sm"
              >
                <option value="">Todos los usuarios</option>
                {uniqueUsers.map((user) => (
                  <option key={user._id || user} value={user._id || user}>
                    {user.name || user.email || "Usuario"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilters && !hasFilterErrors && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-indigo-600">{filteredSales.length}</span> de{" "}
                <span className="font-semibold">{sales.length}</span> ventas
              </p>
            </div>
          )}
          {hasFilterErrors && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ Corrige los errores en los filtros para ver los resultados
              </p>
            </div>
          )}
        </section>

        {/* Historial de Ventas */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
              <div className="animate-ping absolute inset-0 h-16 w-16 border-4 border-indigo-400 rounded-full opacity-20"></div>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-16 border border-gray-200/50 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {hasActiveFilters ? "No hay ventas que coincidan con los filtros" : "No hay ventas aún"}
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters ? "Intenta ajustar los filtros de búsqueda" : "Registra la primera venta para empezar"}
            </p>
          </div>
        ) : (
          <section className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-1">
                    Historial
                  </p>
                  <h3 className="text-2xl font-bold text-white">Últimas Ventas</h3>
                </div>
                <div className="flex items-center space-x-2 text-sm text-indigo-100 bg-white/20 px-4 py-2 rounded-lg backdrop-blur">
                  <span>Página</span>
                  <span className="font-bold text-white">
                    {currentPage} / {totalPages}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {paginatedSales.map((sale, idx) => {
                const isExpanded = expandedSaleId === sale._id;
                return (
                  <article key={sale._id} className="group">
                    <button
                      onClick={() =>
                        setExpandedSaleId((prev) => (prev === sale._id ? null : sale._id))
                      }
                      className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                    <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">
                            Venta #{sale._id?.slice(-6) || "N/A"}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {sale.userName || sale.user?.name || sale.userEmail || sale.user?.email || "Usuario eliminado"}
                          </p>
                          {(!sale.user && sale.userName) && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              Usuario eliminado
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </p>
                    </div>
                      </div>
                      <div className="flex items-center gap-6">
                    <div className="text-right">
                          <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            ${Number(sale.total || 0).toFixed(2)}
                      </p>
                    </div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          isExpanded ? "bg-indigo-600 text-white rotate-180" : "bg-gray-100 text-gray-600"
                        }`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                    </div>
                  </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200 animate-slide-in">
                        <div className="space-y-3 pt-4">
                      {sale.items?.map((item) => (
                        <div
                          key={item._id}
                              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {item.product?.name || "Producto"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Cantidad: {item.quantity} × ${Number(item.price).toFixed(2)}
                                  </p>
                                </div>
                          </div>
                          <div className="text-right">
                                <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                  ${(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50">
                <span className="text-sm text-gray-600 font-medium">
                  Mostrando {(currentPage - 1) * SALES_PER_PAGE + 1} -{" "}
                  {Math.min(currentPage * SALES_PER_PAGE, sales.length)} de {sales.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      currentPage === 1
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-700 bg-white border-2 border-gray-300 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md"
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      currentPage === totalPages
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-700 bg-white border-2 border-gray-300 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md"
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
