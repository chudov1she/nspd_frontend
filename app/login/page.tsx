"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CircleNotchIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import { login } from "@/lib/api/auth"
import { getUserById } from "@/lib/api/users"
import { getJwtSubject } from "@/lib/auth/jwt"
import { useAuthStore } from "@/lib/auth/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const setTokens = useAuthStore((state) => state.setTokens)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error("Введите email и пароль")
      return
    }

    setLoading(true)
    try {
      const tokens = await login({
        email: email.trim(),
        password,
      })
      setTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      })

      const userId = getJwtSubject(tokens.access_token)
      if (userId) {
        const currentUser = await getUserById(userId)
        setCurrentUser(currentUser)
      }

      toast.success("Вы успешно вошли в систему")
      router.replace("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось выполнить вход")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход в NSPD</CardTitle>
          <CardDescription>Введите данные учетной записи</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <CircleNotchIcon className="animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
