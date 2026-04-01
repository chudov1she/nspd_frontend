"use client"

import { apiRequest } from "@/lib/api/client"

type LoginParams = {
  email: string
  password: string
}

type TokenPairResponse = {
  access_token: string
  refresh_token: string
  token_type: "bearer"
}

export function login(params: LoginParams) {
  return apiRequest<TokenPairResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  }, false, false)
}

export function refresh(refreshToken: string) {
  return apiRequest<TokenPairResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  }, false, false)
}
