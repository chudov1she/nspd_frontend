import type { SystemUser } from "@/lib/types"

const usersStore: SystemUser[] = [
  {
    id: "U-1",
    name: "Dmitry Solo",
    email: "d.solo@example.com",
    lastSeenAt: "2026-03-31T08:20:00.000Z",
  },
  {
    id: "U-2",
    name: "Olga Petrova",
    email: "o.petrova@example.com",
    lastSeenAt: "2026-03-30T16:42:00.000Z",
  },
  {
    id: "U-3",
    name: "Ivan Smirnov",
    email: "i.smirnov@example.com",
    lastSeenAt: "2026-03-28T11:05:00.000Z",
  },
]

const userPasswordsStore = new Map<string, string>([
  ["U-1", "demo-password-1"],
  ["U-2", "demo-password-2"],
  ["U-3", "demo-password-3"],
])

export function getUsers(): SystemUser[] {
  return [...usersStore]
}

export function createUser(params: { name: string; email: string; password?: string }): SystemUser {
  const nextNumber = usersStore.length + 1
  const user: SystemUser = {
    id: `U-${nextNumber}`,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    lastSeenAt: new Date().toISOString(),
  }
  usersStore.push(user)
  userPasswordsStore.set(user.id, params.password?.trim() || "changeme123")
  return { ...user }
}

export function updateUser(
  id: string,
  params: { name: string; email: string }
): SystemUser | undefined {
  const user = usersStore.find((item) => item.id === id)
  if (!user) return undefined

  user.name = params.name.trim()
  user.email = params.email.trim().toLowerCase()
  return { ...user }
}

export function deleteUser(id: string): boolean {
  const index = usersStore.findIndex((item) => item.id === id)
  if (index < 0) return false

  usersStore.splice(index, 1)
  userPasswordsStore.delete(id)
  return true
}

export function setUserPassword(id: string, password: string): boolean {
  const userExists = usersStore.some((item) => item.id === id)
  if (!userExists) return false

  userPasswordsStore.set(id, password)
  return true
}
