const variants = {
  success: "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800",
  error: "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800",
  info: "bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 text-blue-800",
};

export default function Alert({ variant = "info", message, onClose }) {
  if (!message) return null;
  const classes = variants[variant] || variants.info;

  return (
    <>
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
      <div
        className={`${classes} px-6 py-4 rounded-xl flex items-center justify-between shadow-lg animate-slide-in`}
      >
        <div className="flex items-center gap-3">
          {variant === "error" && (
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {variant === "success" && (
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {variant === "info" && (
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-semibold">{message}</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="font-bold opacity-70 hover:opacity-100 hover:scale-110 transition-all text-lg"
          >
            ✕
          </button>
        )}
      </div>
    </>
  );
}
