import { create } from "zustand";
import { api } from "../shared/services/api.js";
import { getToken, getUser, setSession, clearSession, setUnauthorizedHandler } from "../shared/auth/session.js";

export const useAuthStore = create((set) => ({
  token: getToken(),
  user: getUser(),
  authed: !!getToken(),
  busy: false,
  error: "",
  async login(email, password) {
    set({ busy: true, error: "" });
    try {
      const { token, user } = await api.login(email, password);
      setSession(token, user);
      set({ token, user, authed: true, busy: false });
      return true;
    } catch (e) {
      set({ busy: false, error: e.message || "Sign in failed." });
      return false;
    }
  },
  logout() { clearSession(); set({ token: null, user: null, authed: false }); },
}));

// When any request hits 401, log the user out.
setUnauthorizedHandler(() => useAuthStore.getState().logout());
