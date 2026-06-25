import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { getJob, cancelJob } from "../api/jobs";
import StatusBadge from "../components/StatusBadge";
import useAuth from "../store/auth";

export default function JobDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { token } = useAuth();
  const outputRef = useRef(null);
  const [wsOutput, setWsOutput] = useState("");

  const { data: job } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id),
    refetchInterval: (data) => (data && ["success", "failed", "canceled"].includes(data.status) ? false : 3000),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(id),
    onSuccess: () => { qc.invalidateQueries(["job", id]); toast.success("Canceled"); },
  });

  useEffect(() => {
    if (!job || ["success", "failed", "canceled"].includes(job.status)) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/jobs/${id}/output?token=${token}`);
    ws.onmessage = (e) => {
      setWsOutput((prev) => prev + e.data);
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    };
    ws.onclose = () => qc.invalidateQueries(["job", id]);
    return () => ws.close();
  }, [job?.status, id, token, qc]);

  if (!job) return <div className="p-8 text-gray-400">Loading…</div>;

  const output = wsOutput || job.output || "";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/jobs" className="text-gray-400 hover:text-white"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">{job.name || `Job #${job.id}`}</h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Created {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : ""}
            {job.finished_at && ` · Finished ${formatDistanceToNow(new Date(job.finished_at), { addSuffix: true })}`}
          </div>
        </div>
        {["pending", "running"].includes(job.status) && (
          <button onClick={() => cancelMutation.mutate()} className="flex items-center gap-1.5 text-sm border border-red-700 text-red-400 hover:bg-red-900/30 px-3 py-1.5 rounded-md">
            <XCircle size={14} /> Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        {[["Playbook", `#${job.playbook_id}`], ["Inventory", `#${job.inventory_id}`], ["Credential", `#${job.credential_id}`], ["Verbosity", job.verbosity], ["Limit", job.limit || "all"], ["Return Code", job.return_code ?? "—"]].map(([label, value]) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-white font-medium mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl">
        <div className="px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-mono flex items-center gap-2">
          <span className="text-green-400">$</span> output
        </div>
        <div ref={outputRef} className="p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap overflow-y-auto max-h-[60vh] leading-relaxed">
          {output || <span className="text-gray-600">No output yet…</span>}
        </div>
      </div>
    </div>
  );
}
