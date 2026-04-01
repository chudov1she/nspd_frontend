"use client"

import { apiRequest } from "@/lib/api/client"
import type { SystemUser } from "@/lib/types"

type UserCreateParams = {
  name: string
  email: string
  password: string
}

type UserUpdateParams = {
  name: string
  email: string
}

export function listUsers() {
  return apiRequest<SystemUser[]>("/users", {
    method: "GET",
  })
}

export function getUserById(userId: string) {
  return apiRequest<SystemUser>(`/users/${userId}`, {
    method: "GET",
  })
}

export function createUser(params: UserCreateParams) {
  return apiRequest<SystemUser>("/users", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function updateUser(userId: string, params: UserUpdateParams) {
  return apiRequest<SystemUser>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}

export function updateUserPassword(userId: string, password: string) {
  return apiRequest<void>(`/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  })
}

export function deleteUser(userId: string) {
  return apiRequest<void>(`/users/${userId}`, {
    method: "DELETE",
  })
}
