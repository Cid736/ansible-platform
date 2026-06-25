import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { getInventory, createHost, deleteHost, updateHost } from "../api/inventories";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY = { name: "", address: "", port: 22, group_name: "all", variables: "", description: "" };

export default function InventoryDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: inv, isLoading } = useQuery({ queryKey: ["inventory", id], queryFn: () => getInventory(id) });

  const addMutation = useMutation({
    mutationFn: (data) => createHost(id, data),
    onSuccess: () => { qc.invalidateQueries(["inventory", id]); setShowAdd(false); setForm(EMPTY); toast.success("Host added"); },
    onError: () => toast.error("Failed to add host"),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ invId, hostId }) => deleteHost(invId, hostId),
    onSuccess: () => { qc.invalidateQueries(["inventory", id]); setDeleteTarget(null); toast.success("Host removed"); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ hostId, enabled }) => updateHost(id, hostId, { enabled }),
    onSuccess: () => qc.invalidateQueries(["inventory", id]),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/inventories" className="text-gray-400 hover:text-white"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-white">{inv.name}</h1>
          {inv.description && <p className="text-xs text-gray-500">{inv.description}</p>}
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md">
          <Plus size={14} /> Add Host
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {inv.hosts.length === 0 && <div className="px-5 py-4 text-sm text-gray-500">No hosts yet.</div>}
        {inv.hosts.map((h) => (
          <div key={h.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50">
            <button onClick={() => toggleMutation.mutate({ hostId: h.id, enabled: !h.enabled })}>
              {h.enabled ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} className="text-gray-500" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium">{h.name}</div>
              <div className="text-xs text-gray-500">{h.address}:{h.port} · group: {h.group_name || "all"}</div>
            </div>
            <button onClick={() => setDeleteTarget(h)} className="text-gray-600 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add Host" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            {[
              { key: "name", label: "Name *", placeholder: "web01" },
              { key: "address", label: "Address *", placeholder: "192.168.1.10" },
              { key: "port", label: "Port", placeholder: "22", type: "number" },
              { key: "group_name", label: "Group", placeholder: "webservers" },
            ].map(({ key, label, placeholder, type = "text" }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type={type} placeholder={placeholder} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={form[key]} onChange={(e) => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Variables (JSON)</label>
              <textarea className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white font-mono resize-none" rows={3} placeholder='{"ansible_user": "ubuntu"}' value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => addMutation.mutate(form)} disabled={!form.name || !form.address || addMutation.isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                {addMutation.isPending ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Remove host "${deleteTarget.name}"?`}
          onConfirm={() => deleteMutation.mutate({ invId: id, hostId: deleteTarget.id })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
