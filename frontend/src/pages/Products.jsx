import { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const fileInputRef = useRef(null);

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
    setSelectedImage(null);
    setImagePreview(null);
    setEditingId(null);
    setShowImageModal(false);
    // Limpiar el input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    // Limpiar el input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openImageModal = (imageUrl) => {
    if (imageUrl) {
      setModalImageUrl(imageUrl);
      setShowImageModal(true);
    }
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
    setSelectedImage(null);
    setImagePreview(product.imageUrl || null);
    setEditingId(product._id);
    // Limpiar el input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona un archivo de imagen");
        return;
      }
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen es demasiado grande. Máximo 5MB");
        return;
      }
      setSelectedImage(file);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    // Limpiar error cuando el usuario empieza a escribir
    if (error && (field === "price" || field === "stock")) {
      setError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      // Validar valores negativos antes de enviar
      const price = Number(form.price);
      const stock = Number(form.stock);

      if (price < 0) {
        setError("El precio no puede ser negativo");
        return;
      }

      if (stock < 0) {
        setError("El stock no puede ser negativo");
        return;
      }

      setUploadingImage(true);

      let imageUrl = form.imageUrl;

      // Si hay una imagen seleccionada, subirla primero
      if (selectedImage) {
        try {
          const formData = new FormData();
          formData.append("image", selectedImage);
          
          // No establecer Content-Type manualmente, axios lo hace automáticamente para FormData
          const uploadRes = await axiosClient.post("/upload/image", formData);
          imageUrl = uploadRes.data.imageUrl;
        } catch (uploadErr) {
          setUploadingImage(false);
          setError(uploadErr.response?.data?.message || "Error al subir la imagen");
          return;
        }
      }

      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        imageUrl: imageUrl || undefined, // Solo incluir si hay URL
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
    } finally {
      setUploadingImage(false);
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
      <Navbar title="Gestión de inventario" subtitle="Productos" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Alerts */}
        <Alert variant="success" message={success} onClose={() => setSuccess("")} />
        <Alert variant="error" message={error} onClose={() => setError("")} />

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
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                              handleInputChange("price", value);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0) {
                              handleInputChange("price", "0");
                            }
                          }}
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
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || (!isNaN(value) && parseInt(value) >= 0)) {
                              handleInputChange("stock", value);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 0) {
                              handleInputChange("stock", "0");
                            }
                          }}
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
                      Imagen del Producto
                    </label>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      {imagePreview && (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 group">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openImageModal(imagePreview)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageModal(imagePreview);
                              }}
                              className="opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-800 rounded-lg px-3 py-2 text-sm font-semibold transition-all flex items-center gap-2 shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              Ver más grande
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all z-10"
                            title="Eliminar imagen"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 5MB
                    </p>
                </div>

                <button
                  type="submit"
                    disabled={uploadingImage}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform flex items-center justify-center gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Subiendo imagen...</span>
                      </>
                    ) : (
                      <span>{editingId ? "Actualizar Producto" : "Crear Producto"}</span>
                    )}
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
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:opacity-80 transition-opacity" onClick={() => imagePreview && openImageModal(imagePreview)}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
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
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow relative">
                              {p.imageUrl ? (
                                <img 
                                  src={p.imageUrl} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                                  onClick={() => openImageModal(p.imageUrl)}
                                  title="Click para ver más grande"
                                />
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

      {/* Modal de imagen ampliada */}
      {showImageModal && modalImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={modalImageUrl}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 shadow-lg transition-all backdrop-blur-sm"
              title="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
