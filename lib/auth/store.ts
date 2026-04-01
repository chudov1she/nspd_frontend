"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { SystemUser } from "@/lib/types"

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  currentUser: SystemUser | null
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void
  setCurrentUser: (user: SystemUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      setTokens: ({ accessToken, refreshToken }) =>
        set({
          accessToken,
          refreshToken,
        }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          currentUser: null,
        }),
    }),
    {
      name: "nspd-auth",
    }
  )
)
