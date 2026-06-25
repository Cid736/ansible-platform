import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Server, BookOpen, KeyRound,
  Play, Users, LogOut, Terminal,
} from "lucide-react";
import useAuth from "../store/auth";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventories", icon: Server, label: "Inventories" },
  { to: "/playbooks", icon: BookOpen, label: "Playbooks" },
  { to: "/credentials", icon: KeyRound, label: "Credentials" },
  { to: "/jobs", icon: Play, label: "Jobs" },
  { to: "/users", icon: Users, label: "Users" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-2 border-b border-gray-800">
          <Terminal className="text-blue-400" size={20} />
          <span className="font-bold text-white text-sm">Ansible Platform</span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-1 truncate">{user?.email}</div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
