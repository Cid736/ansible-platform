import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { getPlaybooks, createPlaybook, updatePlaybook, deletePlaybook, uploadPlaybook } from "../api/playbooks";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY_CONTENT = `---\n- name: My Playbook\n  hosts: all\n  become: true\n  tasks:\n    - name: Ping\n      ansible.builtin.ping:\n`;

export default function Playbooks() {
  const qc = useQueryClient();
  const [mode, setMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", content: EMPTY_CONTENT });
  const [file, setFile] = useState(null);

  const { data: playbooks = [], isLoading } = useQuery({ queryKey: ["playbooks"], queryFn: getPlaybooks });

  const createMutation = useMutation({ mutationFn: createPlaybook, onSuccess: () => { qc.invalidateQueries(["playbooks"]); setMode(null); toast.success("Saved"); }, onError: () => toast.error("Failed") });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updatePlaybook(id, data), onSuccess: () => { qc.invalidateQueries(["playbooks"]); setMode(null); toast.success("Updated"); }, onError: () => toast.error("Failed") });
  const uploadMutation = useMutation({ mutationFn: uploadPlaybook, onSuccess: () => { qc.invalidateQueries(["playbooks"]); setMode(null); toast.success("Uploaded"); }, onError: () => toast.error("Upload failed") });
  const deleteMutation = useMutation({ mutationFn: deletePlaybook, onSuccess: () => { qc.invalidateQueries(["playbooks"]); setDeleteTarget(null); toast.success("Deleted"); } });

  const openEdit = (pb) => { setEditTarget(pb); setForm({ name: pb.name, description: pb.description || "", content: pb.content }); setMode("edit"); };
  const handleSave = () => mode === "edit" ? updateMutation.mutate({ id: editTarget.id, data: form }) : createMutation.mutate(form);
  const handleUpload = () => { if (!file) return; const fd = new FormData(); fd.append("file", file); uploadMutation.mutate(fd); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Playbooks</h1>
        <div className="flex gap-2">
          <button onClick={() => setMode("upload")} className="flex items-center gap-1.5 border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm px-3 py-1.5 rounded-md"><Upload size={14} /> Upload</button>
          <button onClick={() => { setForm({ name: "", description: "", content: EMPTY_CONTENT }); setMode("create"); }} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md"><Plus size={14} /> New</button>
        </div>
      </div>

      {isLoading ? <div className="text-gray-400">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {playbooks.length === 0 && <div className="px-5 py-4 text-sm text-gray-500">No playbooks yet.</div>}
          {playbooks.map((pb) => (
            <div key={pb.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/50">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{pb.name}</div>
                <div className="text-xs text-gray-500 font-mono">{pb.filename} · {pb.description || "No description"}</div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button onClick={() => openEdit(pb)} className="text-gray-500 hover:text-blue-400"><Edit size={14} /></button>
                <button onClick={() => setDeleteTarget(pb)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(mode === "create" || mode === "edit") && (
        <Modal title={mode === "edit" ? "Edit Playbook" : "New Playbook"} onClose={() => setMode(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                <input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Content</label>
              <textarea className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-xs text-green-300 font-mono resize-none" rows={14} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMode(null)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={!form.name || !form.content} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {mode === "upload" && (
        <Modal title="Upload Playbook" onClose={() => setMode(null)}>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-md p-8 text-center">
              <input type="file" accept=".yml,.yaml" className="hidden" id="pb-upload" onChange={(e) => setFile(e.target.files[0])} />
              <label htmlFor="pb-upload" className="cursor-pointer text-sm text-gray-400 hover:text-white">
                {file ? file.name : "Click to select a .yml file"}
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMode(null)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleUpload} disabled={!file || uploadMutation.isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                {uploadMutation.isPending ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDialog message={`Delete playbook "${deleteTarget.name}"?`} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
