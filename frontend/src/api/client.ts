import type { ApiErrorBody, CompareResult, PlayerResult } from '../types/player'

export class ApiError extends Error {
  code: string
  status: number
  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.code = body.error
    this.status = status
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiErrorBody = { error: 'unknown', message: 'Something went wrong. Please try again.' }
    try {
      body = await res.json()
    } catch {
      // response wasn't JSON; keep the default message
    }
    throw new ApiError(res.status, body)
  }
  return res.json() as Promise<T>
}

export function fetchPlayer(username: string, signal?: AbortSignal): Promise<PlayerResult> {
  return fetch(`/api/player?username=${encodeURIComponent(username)}`, { signal }).then((r) =>
    handle<PlayerResult>(r),
  )
}

export function fetchComparison(
  usernameA: string,
  usernameB: string,
  signal?: AbortSignal,
): Promise<CompareResult> {
  const params = new URLSearchParams({ a: usernameA, b: usernameB })
  return fetch(`/api/compare?${params.toString()}`, { signal }).then((r) => handle<CompareResult>(r))
}
