"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  ListChecksIcon,
  SignOutIcon,
  SparkleIcon,
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getLatestApiBalance } from "@/lib/api/tasks"
import { updateUser, updateUserPassword } from "@/lib/api/users"
import { useAuthStore } from "@/lib/auth/store"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const API_BALANCE_POLL_MS = 120000

type NavUserProps = {
  user: {
    id: string
    name: string
    email: string
    avatar: string
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)
  const logout = useAuthStore((state) => state.logout)
  const [editOpen, setEditOpen] = React.useState(false)
  const [name, setName] = React.useState(user.name)
  const [email, setEmail] = React.useState(user.email)
  const [password, setPassword] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [apiBalance, setApiBalance] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      if (cancelled) return
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        scheduleNext()
        return
      }
      try {
        const payload = await getLatestApiBalance()
        if (!cancelled) setApiBalance(payload.balance)
      } catch {
        if (!cancelled) setApiBalance(null)
      } finally {
        scheduleNext()
      }
    }

    const scheduleNext = () => {
      if (cancelled) return
      timer = setTimeout(() => {
        void load()
      }, API_BALANCE_POLL_MS)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return
      if (timer) clearTimeout(timer)
      void load()
    }

    void load()
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  function handleLogout() {
    logout()
    toast.success("Вы вышли из системы")
    router.replace("/login")
  }

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
      const updatedUser = await updateUser(user.id, { name, email })
      if (password.trim()) {
        await updateUserPassword(user.id, password)
      }

      setCurrentUser(updatedUser)
      setEditOpen(false)
      setPassword("")
      toast.success("Профиль обновлен")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось обновить профиль")
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

  function generatePassword(length = 14): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} className="rounded-lg" />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  API баланс: {apiBalance == null ? "n/a" : apiBalance.toFixed(2)}
                </span>
              </div>
              <DotsThreeVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    API баланс: {apiBalance == null ? "n/a" : apiBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <ListChecksIcon />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <SignOutIcon />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Редактировать профиль</AlertDialogTitle>
              <AlertDialogDescription>
                Обновите имя и email пользователя {user.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Имя"
                autoComplete="off"
              />
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                autoComplete="off"
              />
              <div className="flex gap-2">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Новый пароль (необязательно)"
                  type="password"
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
                onClick={() => {
                  setPassword(generatePassword())
                  setCopied(false)
                }}
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
