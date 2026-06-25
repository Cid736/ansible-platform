import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { getCredentials, createCredential, deleteCredential } from "../api/credentials";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY = { name: "", description: "", credential_type: "ssh_password", username: "", password: "", ssh_key: "", become_method: "sudo", become_username: "", become_password: "" };
const TYPE_LABEL = { ssh_password: "SSH Password", ssh_key: "SSH Key", vault: "Vault" };

export default function Credentials() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: creds = [], isLoading } = useQuery({ queryKey: ["credentials"], queryFn: getCredentials });
  const createMutation = useMutation({ mutationFn: createCredential, onSuccess: () => { qc.invalidateQueries(["credentials"]); setShowCreate(false); setForm(EMPTY); toast.success("Credential created"); }, onError: () => toast.error("Failed") });
  const deleteMutation = useMutation({ mutationFn: deleteCredential, onSuccess: () => { qc.invalidateQueries(["credentials"]); setDeleteTarget(null); toast.success("Deleted"); } });
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Credentials</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md"><Plus size={14} /> New</button>
      </div>

      {isLoading ? <div className="text-gray-400">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {creds.length === 0 && <div className="px-5 py-4 text-sm text-gray-500">No credentials yet.</div>}
          {creds.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <KeyRound size={14} className="text-yellow-400 shrink-0" />
                <div>
                  <div className="text-sm text-white font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{TYPE_LABEL[c.credential_type]} · {c.username || "no user"}</div>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(c)} className="text-gray-600 hover:text-red-400 ml-3"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Credential" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <div><label className="block text-xs text-gray-400 mb-1">Name *</label><input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("name")} /></div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("credential_type")}>
                <option value="ssh_password">SSH Password</option>
                <option value="ssh_key">SSH Key</option>
                <option value="vault">Vault</option>
              </select>
            </div>
            <div><label className="block text-xs text-gray-400 mb-1">Username</label><input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("username")} /></div>
            {form.credential_type === "ssh_password" && (
              <div><label className="block text-xs text-gray-400 mb-1">Password</label><input type="password" className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("password")} /></div>
            )}
            {form.credential_type === "ssh_key" && (
              <div><label className="block text-xs text-gray-400 mb-1">Private Key</label><textarea rows={6} placeholder="-----BEGIN RSA PRIVATE KEY-----" className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-xs text-green-300 font-mono resize-none" {...f("ssh_key")} /></div>
            )}
            <div className="border-t border-gray-700 pt-3">
              <label className="block text-xs text-gray-400 mb-2">Privilege Escalation</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Method</label>
                  <select className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" {...f("become_method")}>
                    <option value="sudo">sudo</option><option value="su">su</option><option value="">none</option>
                  </select>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Become User</label><input className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" placeholder="root" {...f("become_username")} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                {createMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDialog message={`Delete credential "${deleteTarget.name}"?`} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
