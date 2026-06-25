import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getInventories, createInventory, deleteInventory } from "../api/inventories";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Inventories() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: inventories = [], isLoading } = useQuery({ queryKey: ["inventories"], queryFn: getInventories });

  const createMutation = useMutation({
    mutationFn: createInventory,
    onSuccess: () => { qc.invalidateQueries(["inventories"]); setShowCreate(false); setForm({ name: "", description: "" }); toast.success("Inventory created"); },
    onError: () => toast.error("Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: () => { qc.invalidateQueries(["inventories"]); setDeleteTarget(null); toast.success("Deleted"); },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Inventories</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md">
          <Plus size={14} /> New
        </button>
      </div>

      {isLoading ? <div className="text-gray-400">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {inventories.length === 0 && <div className="px-5 py-4 text-sm text-gray-500">No inventories yet.</div>}
          {inventories.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/50">
              <Link to={`/inventories/${inv.id}`} className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium flex items-center gap-1">
                  {inv.name} <ChevronRight size={12} className="text-gray-500" />
                </div>
                <div className="text-xs text-gray-500">{inv.host_count} hosts · {inv.description || "No description"}</div>
              </Link>
              <button onClick={() => setDeleteTarget(inv)} className="text-gray-600 hover:text-red-400 ml-3">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Inventory" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name *</label>
              <input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                {createMutation.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete inventory "${deleteTarget.name}"? All hosts will be removed.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
