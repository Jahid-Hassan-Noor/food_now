"use client"

export type UserRole = "user" | "chef" | "admin"

export type AuthUser = {
  id?: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
}

export type AuthSession = {
  access: string
  refresh: string
  role: UserRole
  user: AuthUser
}

type LoginResponse = {
  access: string
  refresh: string
  user: AuthUser
}

type RegisterPayload = {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

const SESSION_KEYS = {
  access: "access",
  refresh: "refresh",
  role: "role",
  user: "user",
} as const

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password"])

const ROLE_PRIORITY: Record<UserRole, number> = {
  user: 1,
  chef: 2,
  admin: 3,
}

const ROLE_RULES: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/dashboard/admin", role: "admin" },
  { prefix: "/transactions", role: "admin" },
  { prefix: "/subscription/pending", role: "admin" },
  { prefix: "/subscription/options", role: "admin" },
  { prefix: "/subscription/history", role: "admin" },
  { prefix: "/dashboard/chef", role: "chef" },
  { prefix: "/campaign-orders", role: "chef" },
  { prefix: "/campaign", role: "chef" },
  { prefix: "/subscription/get", role: "chef" },
  { prefix: "/subscription", role: "chef" },
  { prefix: "/dashboard/user", role: "user" },
  { prefix: "/dashboard", role: "user" },
  { prefix: "/your-orders", role: "user" },
  { prefix: "/account", role: "user" },
  { prefix: "/notifications", role: "user" },
  { prefix: "/support", role: "user" },
  { prefix: "/feedback", role: "user" },
]

function normalizePath(pathname: string): string {
  const cleaned = pathname.replace(/\/+$/, "")
  return cleaned || "/"
}

function hasStorage() {
  return typeof window !== "undefined" && !!window.localStorage
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function isTokenExpired(token: string, skewSeconds = 15): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now + skewSeconds
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const detail =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.message === "string" && data.message) ||
      "Request failed"
    throw new Error(detail)
  }

  return data as T
}

export function normalizeRole(role: string | null | undefined): UserRole {
  const value = String(role ?? "").toLowerCase()
  if (value === "admin" || value === "chef" || value === "user") {
    return value
  }
  return "user"
}

export function canAccessRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_PRIORITY[userRole] >= ROLE_PRIORITY[requiredRole]
}

export function getRequiredRole(pathname: string): UserRole | null {
  const path = normalizePath(pathname)

  for (const rule of ROLE_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.role
    }
  }

  return null
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(normalizePath(pathname))
}

export function defaultRouteForRole(role: UserRole): string {
  if (role === "admin") return "/dashboard/admin"
  if (role === "chef") return "/dashboard/chef"
  return "/dashboard/user"
}

export function getStoredSession(): AuthSession | null {
  if (!hasStorage()) return null

  const access = localStorage.getItem(SESSION_KEYS.access)
  const refresh = localStorage.getItem(SESSION_KEYS.refresh)
  const role = localStorage.getItem(SESSION_KEYS.role)
  const userRaw = localStorage.getItem(SESSION_KEYS.user)

  if (!access || !refresh || !userRaw) return null

  try {
    const user = JSON.parse(userRaw) as AuthUser
    return {
      access,
      refresh,
      role: normalizeRole(role ?? user?.role),
      user,
    }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  if (!hasStorage()) return
  localStorage.removeItem(SESSION_KEYS.access)
  localStorage.removeItem(SESSION_KEYS.refresh)
  localStorage.removeItem(SESSION_KEYS.role)
  localStorage.removeItem(SESSION_KEYS.user)
}

export function saveSession(payload: LoginResponse): AuthSession {
  const role = normalizeRole(payload.user?.role)
  const session: AuthSession = {
    access: payload.access,
    refresh: payload.refresh,
    role,
    user: payload.user,
  }

  if (hasStorage()) {
    localStorage.setItem(SESSION_KEYS.access, session.access)
    localStorage.setItem(SESSION_KEYS.refresh, session.refresh)
    localStorage.setItem(SESSION_KEYS.role, session.role)
    localStorage.setItem(SESSION_KEYS.user, JSON.stringify(session.user))
  }

  return session
}

export async function registerRequest(payload: RegisterPayload) {
  return requestJson<AuthUser>("/auth/register/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function loginRequest(username: string, password: string) {
  const response = await requestJson<LoginResponse>("/auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })

  return saveSession(response)
}

export async function forgotPasswordRequest(email: string) {
  return requestJson<{
    detail: string
    reset_link?: string
    debug?: { email_sent: boolean; reason: string }
  }>("/auth/forgot-password/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
}

export async function resetPasswordRequest(
  token: string,
  password: string,
  confirmPassword: string
) {
  return requestJson<{ detail: string }>("/auth/reset-password/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      password,
      confirm_password: confirmPassword,
    }),
  })
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await requestJson<{ access: string }>("/auth/token/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  })

  if (!response.access) {
    throw new Error("Unable to refresh session")
  }

  return response.access
}

export async function ensureValidSession(): Promise<AuthSession | null> {
  const session = getStoredSession()
  if (!session) return null

  if (isTokenExpired(session.refresh)) {
    clearSession()
    return null
  }

  if (!isTokenExpired(session.access)) {
    return session
  }

  try {
    const newAccess = await refreshAccessToken(session.refresh)
    const nextSession = {
      ...session,
      access: newAccess,
    }

    if (hasStorage()) {
      localStorage.setItem(SESSION_KEYS.access, newAccess)
    }

    return nextSession
  } catch {
    clearSession()
    return null
  }
}

export async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const session = await ensureValidSession()
  if (!session) {
    throw new Error("Session expired. Please login again.")
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access}`,
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const detail =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.message === "string" && data.message) ||
      "API request failed"
    throw new Error(detail)
  }

  return data as T
}
