"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckIcon, CopyIcon, ListChecksIcon, SparkleIcon, XIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Input
} from "@/components/ui/input"
import type { SystemUser } from "@/lib/types"
import { DataTable } from "@/components/data-table"
import { deleteUser, updateUser, updateUserPassword } from "@/lib/api/users"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const columnLabels: Record<string, string> = {
  name: "Имя",
  email: "Email",
  lastSeenAt: "Последний вход",
}

function formatServerDate(value: string | null): string {
  if (!value) return "Нет данных"
  return value.includes("T")
    ? new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(value))
    : value
}

function ConfirmDeleteButton({
  title,
  onConfirm,
}: {
  title: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <XIcon />
          Удалить
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
          <AlertDialogDescription>
            Пользователь {title} будет удален без возможности восстановления.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function generatePassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

function UserCellViewer({
  user,
  onUsersChanged,
}: {
  user: SystemUser
  onUsersChanged: () => Promise<void>
}) {
  const lastSeenText = formatServerDate(user.lastSeenAt)

  const isMobile = useIsMobile()
  const [editOpen, setEditOpen] = React.useState(false)
  const [name, setName] = React.useState(user.name)
  const [email, setEmail] = React.useState(user.email)
  const [password, setPassword] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      toast.error("Заполните имя и email")
      return
    }
    if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
      toast.error("Некорректный формат email")
      return
    }

    try {
      await updateUser(user.id, { name, email })
      if (password.trim()) {
        await updateUserPassword(user.id, password)
      }

      setPassword("")
      setEditOpen(false)
      await onUsersChanged()
      toast.success("Изменения сохранены")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить изменения")
    }
  }

  async function handleDeleteUser() {
    try {
      await deleteUser(user.id)
      await onUsersChanged()
      toast.success("Пользователь удален")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить пользователя")
    }
  }

  async function handleCopyPassword() {
    if (!password.trim()) {
      toast.error("Пароль пустой")
      return
    }
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
      toast.success("Пароль скопирован")
    } catch {
      toast.error("Не удалось скопировать пароль")
    }
  }

  const profileCard = (
    <div className="flex flex-col gap-3 px-4 pb-4 text-sm">
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">ID</p>
        <p className="font-mono font-medium">{user.id}</p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">Email</p>
        <p className="font-medium">{user.email}</p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">Последний вход</p>
        <p className="font-medium">{lastSeenText}</p>
      </div>
    </div>
  )

  const profileActions = (
    <>
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <ListChecksIcon />
        Изменить
      </Button>
      <ConfirmDeleteButton title={user.name} onConfirm={handleDeleteUser} />
    </>
  )

  return (
    <>
      {isMobile ? (
        <Drawer direction="bottom">
          <DrawerTrigger asChild>
            <Button variant="link" className="w-fit px-0 text-left text-foreground">
              {user.name}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="gap-1">
              <DrawerTitle>{user.name}</DrawerTitle>
              <DrawerDescription>Карточка пользователя</DrawerDescription>
            </DrawerHeader>
            {profileCard}
            <DrawerFooter className="grid grid-cols-2 gap-2 border-t">{profileActions}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="link" className="w-fit px-0 text-left text-foreground">
              {user.name}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[360px] max-w-none p-0">
            <SheetHeader className="gap-1 p-4">
              <SheetTitle>{user.name}</SheetTitle>
              <SheetDescription>Карточка пользователя</SheetDescription>
            </SheetHeader>
            {profileCard}
            <SheetFooter className="grid grid-cols-2 gap-2 border-t p-4">{profileActions}</SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Редактировать пользователя</AlertDialogTitle>
            <AlertDialogDescription>
              Обновите имя и email пользователя {user.name}.
              <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
                ID: {user.id}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" autoComplete="off" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль (необязательно)"
                autoComplete="off"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                disabled={!password.trim()}
                aria-label="Скопировать пароль"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setPassword(generatePassword())}
            >
              <SparkleIcon />
              Сгенерировать пароль
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveProfile}>Сохранить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function getUserColumns(onUsersChanged: () => Promise<void>): ColumnDef<SystemUser>[] {
  return [
    {
      accessorKey: "name",
      header: "Имя",
      cell: ({ row }) => (
        <UserCellViewer user={row.original} onUsersChanged={onUsersChanged} />
      ),
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "lastSeenAt",
      header: "Последний вход",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatServerDate(row.original.lastSeenAt)}
        </span>
      ),
    },
  ]
}

export function UsersDataTable({
  data,
  onAdd,
  onUsersChanged,
}: {
  data: SystemUser[]
  onAdd?: () => void
  onUsersChanged: () => Promise<void>
}) {
  const columns = React.useMemo(
    () => getUserColumns(onUsersChanged),
    [onUsersChanged]
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      columnLabels={columnLabels}
      onAdd={onAdd}
      addLabel="Добавить"
      emptyText="Нет пользователей."
    />
  )
}
