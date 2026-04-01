"use client"

import { useAuthStore } from "@/lib/auth/store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"

let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) {
    logout()
    return false
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      logout()
      return false
    }

    const data = (await response.json()) as { access_token: string; refresh_token: string }
    setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    })
    return true
  } catch {
    logout()
    return false
  }
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  withAuth = true,
  retryOnUnauthorized = true
): Promise<T> {
  const { accessToken, logout } = useAuthStore.getState()
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")

  if (withAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401 && withAuth && retryOnUnauthorized) {
    const refreshed = await getRefreshPromise()
    if (refreshed) {
      return apiRequest<T>(path, init, withAuth, false)
    }
    logout()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const json = (await response.json()) as { detail?: string }
      if (json?.detail) detail = json.detail
    } catch {
      // No-op: fallback detail is enough
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export { API_BASE_URL }
