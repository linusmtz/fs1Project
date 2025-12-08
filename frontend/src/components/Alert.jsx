const variants = {
  success: "bg-green-50 border-green-200 text-green-700",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

export default function Alert({ variant = "info", message, onClose }) {
  if (!message) return null;
  const classes = variants[variant] || variants.info;

  return (
    <div
      className={`${classes} border px-4 py-3 rounded-lg flex items-center justify-between shadow-sm`}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="font-semibold opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}
