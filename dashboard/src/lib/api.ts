import type { Config, Status } from './types'

function getApiBase(): string {
  return localStorage.getItem('mahoraga_backend_url') || '/agent'
}

function getApiToken(): string {
  return (
    localStorage.getItem('mahoraga_api_token')?.trim() ||
    (window as unknown as { VITE_MAHORAGA_API_TOKEN?: string }).VITE_MAHORAGA_API_TOKEN?.trim() ||
    ''
  )
}

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getApiToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  return fetch(url, { ...options, headers })
}

interface ApiResult<T> {
  data: T | null
  error: string | null
}

export async function fetchStatus(): Promise<ApiResult<Status>> {
  try {
    const res = await authFetch(`${getApiBase()}/status`)
    const json = await res.json()
    if (json.ok) return { data: json.data, error: null }
    return { data: null, error: json.error || 'Failed to fetch status' }
  } catch {
    return { data: null, error: 'Connection failed - is the agent running?' }
  }
}

export async function fetchSetupStatus(): Promise<ApiResult<{ configured: boolean }>> {
  try {
    const res = await authFetch(`${getApiBase()}/setup/status`)
    const json = await res.json()
    if (json.ok) return { data: json.data, error: null }
    return { data: null, error: json.error || 'Failed to check setup' }
  } catch {
    return { data: null, error: 'Connection failed' }
  }
}

export async function saveConfig(config: Config): Promise<ApiResult<Config>> {
  try {
    const res = await authFetch(`${getApiBase()}/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    })
    const json = await res.json()
    if (json.ok) return { data: json.data, error: null }
    return { data: null, error: json.error || 'Failed to save config' }
  } catch {
    return { data: null, error: 'Connection failed' }
  }
}

export async function submitSetupKeys(payload: {
  alpaca_key: string
  alpaca_secret: string
  openai_key?: string
  paper_mode: boolean
  starting_equity: number
}): Promise<ApiResult<unknown>> {
  try {
    const res = await fetch(`${getApiBase()}/setup/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.ok) return { data: json.data, error: null }
    return { data: null, error: json.error || 'Failed to save configuration' }
  } catch {
    return { data: null, error: 'Failed to connect to agent' }
  }
}
