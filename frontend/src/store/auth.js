import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/client";

const useAuth = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (username, password) => {
        const form = new FormData();
        form.append("username", username);
        form.append("password", password);
        const { data } = await api.post("/api/auth/login", form);
        api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
        set({ token: data.access_token });
        const me = await api.get("/api/users/me");
        set({ user: me.data });
        return me.data;
      },

      logout: () => {
        delete api.defaults.headers.common["Authorization"];
        set({ token: null, user: null });
      },

      restoreToken: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
      },
    }),
    { name: "ansible-auth", partialize: (s) => ({ token: s.token }) }
  )
);

export default useAuth;
