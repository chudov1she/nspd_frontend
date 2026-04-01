"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, PlusIcon, SparkleIcon, XIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createUser, listUsers } from "@/lib/api/users"
import type { SystemUser } from "@/lib/types"
import { UsersDataTable } from "@/components/users/users-data-table"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function UsersTable() {
  const [users, setUsers] = React.useState<SystemUser[]>([])
  const [query, setQuery] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newEmail, setNewEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  function generatePassword(length = 14): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  }

  async function refreshUsers() {
    const data = await listUsers()
    setUsers(data)
  }

  React.useEffect(() => {
    void refreshUsers()
      .catch(() => {
        toast.error("Не удалось загрузить пользователей")
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleAddUser() {
    if (loading) return

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Заполните имя, email и пароль")
      return
    }
    if (!EMAIL_REGEX.test(newEmail.trim().toLowerCase())) {
      toast.error("Некорректный формат email")
      return
    }
    try {
      const createdUser = await createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
      })
      setNewName("")
      setNewEmail("")
      setNewPassword("")
      setCopied(false)
      setCreateOpen(false)
      await refreshUsers()
      toast.success(`Пользователь ${createdUser.name} создан`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать пользователя")
    }
  }

  async function handleCopyPassword() {
    if (!newPassword.trim()) {
      toast.error("Пароль пустой")
      return
    }
    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
      toast.success("Пароль скопирован")
    } catch {
      toast.error("Не удалось скопировать пароль")
    }
  }

  const filtered = users.filter((user) => {
    const haystack = `${user.name} ${user.email}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Пользователи системы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по имени или email"
        />

        <UsersDataTable data={filtered} onAdd={() => setCreateOpen(true)} onUsersChanged={refreshUsers} />
      </CardContent>

      <AlertDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setNewName("")
            setNewEmail("")
            setNewPassword("")
            setCopied(false)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Новый пользователь</AlertDialogTitle>
            <AlertDialogDescription>
              Введите имя и email для создания пользователя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Имя пользователя"
              autoComplete="off"
            />
            <Input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="email@example.com"
              type="email"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <Input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Пароль"
                type="password"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                disabled={!newPassword.trim()}
                aria-label="Скопировать пароль"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const password = generatePassword()
                setNewPassword(password)
                setCopied(false)
              }}
            >
              <SparkleIcon />
              Сгенерировать
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <XIcon />
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAddUser}>
              <PlusIcon />
              Создать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
