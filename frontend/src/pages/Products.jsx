import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const PRODUCTS_PER_PAGE = 6;

export default function Products() {
  const { auth } = useContext(AuthContext);
  const isAdmin = auth.user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    imageUrl: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/products");
      setProducts(res.data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
      description: "",
      imageUrl: "",
    });
    setEditingId(null);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
    setEditingId(product._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editingId) {
        await axiosClient.put(`/products/${editingId}`, payload);
        setSuccess("Producto actualizado exitosamente");
      } else {
        await axiosClient.post("/products", payload);
        setSuccess("Producto creado exitosamente");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : err.response?.data?.message || "Ocurrió un error al guardar el producto";
      setError(errorMsg);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }
    try {
      setError("");
      setSuccess("");
      await axiosClient.delete(`/products/${id}`);
      setSuccess("Producto eliminado exitosamente");
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar producto");
    }
  };

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const currentInventoryValue = products.reduce(
    (acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Navbar */}
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
              <p className="text-xs uppercase tracking-[0.3rem] text-indigo-500 font-semibold">Productos</p>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Gestión de inventario
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
              <Link to="/sales" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                Ventas
              </Link>
              {isAdmin && (
                <>
                  <Link to="/users" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                    Usuarios
                  </Link>
                  <Link to="/audit" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                    Auditoría
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Alerts */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-lg animate-slide-in">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-green-700 hover:text-green-900 hover:scale-110 transition-transform">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-lg animate-slide-in">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-700 hover:text-red-900 hover:scale-110 transition-transform">
              ✕
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Productos Totales</p>
                <p className="text-4xl font-bold">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Inventario Disponible</p>
                <p className="text-4xl font-bold">
                  {products.reduce((acc, p) => acc + Number(p.stock || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Valor Inventario</p>
                <p className="text-4xl font-bold">${currentInventoryValue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin Form */}
          {isAdmin && (
            <section className="lg:col-span-1 space-y-6">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                      {editingId ? "Editando" : "Nuevo Producto"}
                    </p>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {editingId ? "Actualizar" : "Crear Producto"}
                    </h2>
                  </div>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Camiseta Premium"
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Categoría
                    </label>
                    <input
                      type="text"
                      placeholder="Categoría o colección"
                      value={form.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Precio
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-semibold">
                          $
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.stock}
                        onChange={(e) => handleInputChange("stock", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descripción del producto..."
                      value={form.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      URL de Imagen
                    </label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={form.imageUrl}
                      onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform"
                  >
                    {editingId ? "Actualizar Producto" : "Crear Producto"}
                  </button>
                </form>
              </div>

              {/* Live preview */}
              {form.name && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-3 shadow-lg">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Vista Previa
                  </p>
                  <div className="bg-white rounded-xl shadow-md p-4 flex space-x-4">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {form.name || "Nombre del producto"}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{form.category || "Categoría"}</p>
                      <p className="mt-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {form.price ? `$${Number(form.price).toFixed(2)}` : "$0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Products List */}
          <section className={isAdmin ? "lg:col-span-2" : "lg:col-span-full"}>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-1">
                      Catálogo
                    </p>
                    <h2 className="text-2xl font-bold text-white">Productos en Inventario</h2>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-indigo-100 bg-white/20 px-4 py-2 rounded-lg backdrop-blur">
                    <span>Página</span>
                    <span className="font-bold text-white">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                    <div className="animate-ping absolute inset-0 h-16 w-16 border-4 border-indigo-400 rounded-full opacity-20"></div>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No hay productos aún.</p>
                  {isAdmin && <p className="text-sm text-gray-400 mt-1">Crea tu primer producto arriba</p>}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 p-6">
                    {paginatedProducts.map((p, idx) => (
                      <article
                        key={p._id}
                        className="group p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 bg-white transform hover:scale-[1.02]"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              ) : (
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {p.name}
                              </h3>
                              <p className="text-sm text-gray-600 font-medium mt-1">{p.category}</p>
                              {p.description && (
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                ${Number(p.price).toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${p.stock > 0 ? "bg-green-500" : "bg-red-500"}`}></div>
                                <p className={`text-sm font-semibold ${p.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {p.stock} unidades
                                </p>
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => deleteProduct(p._id)}
                                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50">
                      <span className="text-sm text-gray-600 font-medium">
                        Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1} -{" "}
                        {Math.min(currentPage * PRODUCTS_PER_PAGE, products.length)} de {products.length}
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
                </>
              )}
            </div>
          </section>
        </div>
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
