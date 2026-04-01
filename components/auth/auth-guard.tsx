"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { getUserById } from "@/lib/api/users"
import { getJwtSubject } from "@/lib/auth/jwt"
import { useAuthStore } from "@/lib/auth/store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const currentUser = useAuthStore((state) => state.currentUser)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)
  const logout = useAuthStore((state) => state.logout)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setReady(useAuthStore.persist.hasHydrated())
    const unsubHydrate = useAuthStore.persist.onFinishHydration(() => setReady(true))
    return () => unsubHydrate()
  }, [])

  React.useEffect(() => {
    if (!ready) return

    const isLoginRoute = pathname === "/login"

    if (!accessToken) {
      if (!isLoginRoute) {
        router.replace("/login")
      }
      return
    }

    if (isLoginRoute) {
      router.replace("/dashboard")
      return
    }

    if (currentUser) return

    const userId = getJwtSubject(accessToken)
    if (!userId) {
      logout()
      router.replace("/login")
      return
    }

    void getUserById(userId)
      .then((user) => setCurrentUser(user))
      .catch(() => {
        logout()
        router.replace("/login")
      })
  }, [accessToken, currentUser, logout, pathname, ready, router, setCurrentUser])

  if (!ready) {
    return null
  }

  if (!accessToken && pathname !== "/login") {
    return null
  }

  if (accessToken && pathname === "/login") {
    return null
  }

  return <>{children}</>
}
