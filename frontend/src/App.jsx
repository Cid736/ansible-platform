import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./store/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventories from "./pages/Inventories";
import InventoryDetail from "./pages/InventoryDetail";
import Playbooks from "./pages/Playbooks";
import Credentials from "./pages/Credentials";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Users from "./pages/Users";

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { restoreToken } = useAuth();
  useEffect(() => { restoreToken(); }, [restoreToken]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="inventories" element={<Inventories />} />
        <Route path="inventories/:id" element={<InventoryDetail />} />
        <Route path="playbooks" element={<Playbooks />} />
        <Route path="credentials" element={<Credentials />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}
