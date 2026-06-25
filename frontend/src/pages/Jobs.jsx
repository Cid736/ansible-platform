import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, XCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { getJobs, launchJob, cancelJob, deleteJob } from "../api/jobs";
import { getInventories } from "../api/inventories";
import { getPlaybooks } from "../api/playbooks";
import { getCredentials } from "../api/credentials";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY = { playbook_id: "", inventory_id: "", credential_id: "", limit: "", verbosity: 0, extra_vars: "", name: "" };

export default function Jobs() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showLaunch, setShowLaunch] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => getJobs(), refetchInterval: 5_000 });
  const { data: inventories = [] } = useQuery({ queryKey: ["inventories"], queryFn: getInventories, enabled: showLaunch });
  const { data: playbooks = [] } = useQuery({ queryKey: ["playbooks"], queryFn: getPlaybooks, enabled: showLaunch });
  const { data: credentials = [] } = useQuery({ queryKey: ["credentials"], queryFn: getCredentials, enabled: showLaunch });

  const launchMutation = useMutation({
    mutationFn: launchJob,
    onSuccess: (job) => { qc.invalidateQueries(["jobs"]); setShowLaunch(false); setForm(EMPTY); toast.success(`Job #${job.id} launched`); navigate(`/jobs/${job.id}`); },
    onError: () => toast.error("Failed to launch job"),
  });
  const cancelMutation = useMutation({ mutationFn: cancelJob, onSuccess: () => { qc.invalidateQueries(["jobs"]); toast.success("Canceled"); } });
  const deleteMutation = useMutation({ mutationFn: deleteJob, onSuccess: () => { qc.invalidateQueries(["jobs"]); setDeleteTarget(null); toast.success("Deleted"); } });
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Jobs</h1>
        <button onClick={() => setShowLaunch(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md"><Plus size={14} /> Launch</button>
      </div>

      {isLoading ? <div className="text-gray-400">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {jobs.length === 0 && <div className="px-5 py-4 text-sm text-gray-500">No jobs yet.</div>}
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50">
              <StatusBadge status={j.status} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{j.name || `Job #${j.id}`}</div>
                <div className="text-xs text-gray-500">{j.created_at ? formatDistanceToNow(new Date(j.created_at), { addSuffix: true }) : ""}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => navigate(`/jobs/${j.id}`)} className="p-1 text-gray-500 hover:text-blue-400"><Eye size={14} /></button>
                {["pending", "running"].includes(j.status) && (
                  <button onClick={() => cancelMutation.mutate(j.id)} className="p-1 text-gray-500 hover:text-yellow-400"><XCircle size={14} /></button>
                )}
                <button onClick={() => setDeleteTarget(j)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLaunch && (
        <Modal title="Launch Job" onClose={() => setShowLaunch(false)}>
          <div className="space-y-3">
            <div><label className="block text-xs text-gray-400 mb-1">Job Name (optional)</label><input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("name")} /></div>
            {[
              { key: "playbook_id", label: "Playbook *", items: playbooks, display: (p) => p.name },
              { key: "inventory_id", label: "Inventory *", items: inventories, display: (i) => i.name },
              { key: "credential_id", label: "Credential *", items: credentials, display: (c) => c.name },
            ].map(({ key, label, items, display }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f(key)}>
                  <option value="">— select —</option>
                  {items.map((item) => <option key={item.id} value={item.id}>{display(item)}</option>)}
                </select>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-400 mb-1">Limit</label><input placeholder="web*" className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("limit")} /></div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Verbosity</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("verbosity")}>
                  {[0,1,2,3,4].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-xs text-gray-400 mb-1">Extra Variables (JSON)</label><textarea rows={3} placeholder='{"env": "production"}' className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white font-mono resize-none" {...f("extra_vars")} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowLaunch(false)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={() => launchMutation.mutate({ ...form, playbook_id: +form.playbook_id, inventory_id: +form.inventory_id, credential_id: +form.credential_id, verbosity: +form.verbosity })}
                disabled={!form.playbook_id || !form.inventory_id || !form.credential_id || launchMutation.isPending}
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {launchMutation.isPending ? "Launching…" : "Launch"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDialog message={`Delete job #${deleteTarget.id}?`} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
