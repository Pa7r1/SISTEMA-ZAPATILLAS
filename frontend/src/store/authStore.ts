// src/store/authStore.ts
import { create } from "zustand";

type Role = "admin" | "empleado" | "cliente";

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  login: (role) => set({ isAuthenticated: true, role }),
  logout: () => set({ isAuthenticated: false, role: null }),
}));
