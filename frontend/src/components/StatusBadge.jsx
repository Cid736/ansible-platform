const COLORS = {
  pending:  "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  running:  "bg-blue-900/40 text-blue-300 border-blue-700 animate-pulse",
  success:  "bg-green-900/40 text-green-300 border-green-700",
  failed:   "bg-red-900/40 text-red-300 border-red-700",
  canceled: "bg-gray-700/40 text-gray-400 border-gray-600",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${COLORS[status] ?? COLORS.pending}`}>
      {status}
    </span>
  );
}
