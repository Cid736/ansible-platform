import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Shield, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import useAuth from "../store/auth";

const getUsers = () => api.get("/api/users/").then((r) => r.data);
const createUser = (data) => api.post("/api/users/", data).then((r) => r.data);
const deleteUser = (id) => api.delete(`/api/users/${id}`);
const toggleSuperuser = (id, is_superuser) => api.put(`/api/users/${id}`, { is_superuser }).then((r) => r.data);

const EMPTY = { username: "", email: "", password: "", is_superuser: false };

export default function Users() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const createMutation = useMutation({ mutationFn: createUser, onSuccess: () => { qc.invalidateQueries(["users"]); setShowCreate(false); setForm(EMPTY); toast.success("User created"); }, onError: (e) => toast.error(e.response?.data?.detail || "Failed") });
  const deleteMutation = useMutation({ mutationFn: deleteUser, onSuccess: () => { qc.invalidateQueries(["users"]); setDeleteTarget(null); toast.success("Deleted"); } });
  const toggleMutation = useMutation({ mutationFn: ({ id, is_superuser }) => toggleSuperuser(id, is_superuser), onSuccess: () => qc.invalidateQueries(["users"]) });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Users</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md"><Plus size={14} /> New User</button>
      </div>

      {isLoading ? <div className="text-gray-400">Loading…</div> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{u.username}</span>
                  {u.is_superuser && <span className="text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700 px-1.5 py-0.5 rounded">superuser</span>}
                  {!u.is_active && <span className="text-xs bg-gray-700/40 text-gray-400 border border-gray-600 px-1.5 py-0.5 rounded">inactive</span>}
                </div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
              {u.id !== me?.id && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleMutation.mutate({ id: u.id, is_superuser: !u.is_superuser })} className="p-1 text-gray-500 hover:text-yellow-400" title={u.is_superuser ? "Remove superuser" : "Make superuser"}>
                    {u.is_superuser ? <ShieldOff size={14} /> : <Shield size={14} />}
                  </button>
                  <button onClick={() => setDeleteTarget(u)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New User" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            {[{ key: "username", label: "Username *" }, { key: "email", label: "Email *", type: "email" }, { key: "password", label: "Password *", type: "password" }].map(({ key, label, type = "text" }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type={type} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-600 bg-gray-800" checked={form.is_superuser} onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })} />
              Superuser
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.username || !form.email || !form.password || createMutation.isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                {createMutation.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDialog message={`Delete user "${deleteTarget.username}"?`} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
