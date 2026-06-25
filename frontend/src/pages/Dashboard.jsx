import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/jobs";
import StatusBadge from "../components/StatusBadge";
import { formatDistanceToNow } from "date-fns";

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 10_000,
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold text-white">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Inventories" value={data.total_inventories} />
        <StatCard label="Playbooks" value={data.total_playbooks} />
        <StatCard label="Credentials" value={data.total_credentials} />
        <StatCard label="Total Jobs" value={data.jobs_total} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Running" value={data.jobs_running} color="text-blue-400" />
        <StatCard label="Successful" value={data.jobs_success} color="text-green-400" />
        <StatCard label="Failed" value={data.jobs_failed} color="text-red-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-3 border-b border-gray-800 text-sm font-medium text-gray-300">
          Recent Jobs
        </div>
        <div className="divide-y divide-gray-800">
          {data.recent_jobs.length === 0 && (
            <div className="px-5 py-4 text-sm text-gray-500">No jobs yet.</div>
          )}
          {data.recent_jobs.map((j) => (
            <div key={j.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm text-white">{j.name || `Job #${j.id}`}</div>
                <div className="text-xs text-gray-500">
                  {j.created_at ? formatDistanceToNow(new Date(j.created_at), { addSuffix: true }) : ""}
                </div>
              </div>
              <StatusBadge status={j.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
