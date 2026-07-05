// Apps Script Web App does not respond to CORS preflight for application/json.
// Sending text/plain avoids preflight; the request is a simple cross-origin POST.

import { mockCall } from './mock'

const API_URL = import.meta.env.VITE_API_URL as string
export const USE_MOCK = !API_URL

if (USE_MOCK) {
  console.warn('[FundApp] VITE_API_URL not set — using in-memory mock backend')
}

export class ApiError extends Error {
  readonly action: string
  constructor(message: string, action: string) {
    super(message)
    this.action = action
  }
}

export async function callApi<TResp = unknown>(
  action: string,
  payload: unknown,
  idToken: string | null,
): Promise<TResp> {
  if (USE_MOCK) return mockCall<TResp>(action, payload)

  if (!idToken) throw new ApiError('not signed in', action)

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ idToken, action, payload }),
  })

  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, action)

  const json = (await res.json()) as { ok: boolean; data?: TResp; error?: string }
  if (!json.ok) throw new ApiError(json.error || 'unknown error', action)
  return json.data as TResp
}
