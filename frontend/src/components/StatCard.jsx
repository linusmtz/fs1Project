export default function StatCard({ label, value, helper }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}
