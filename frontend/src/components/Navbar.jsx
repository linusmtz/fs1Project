import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar({ title, subtitle }) {
  const { auth } = useContext(AuthContext);
  const isAdmin = auth.user?.role === "admin";

  return (
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
            <p className="text-xs uppercase tracking-[0.3rem] text-indigo-500 font-semibold">{subtitle || ""}</p>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <Link to="/products" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
              Productos
            </Link>
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
  );
}

