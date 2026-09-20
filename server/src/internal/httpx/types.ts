/**
 * Minimal HTTP shapes used by the handlers.
 *
 * Both Express's `Request`/`Response` AND Vercel's native serverless
 * `VercelRequest`/`VercelResponse` satisfy these interfaces structurally, so the same
 * handler code runs unchanged in local dev (Express) and in production (Vercel functions).
 *
 * Do NOT use Express-only helpers (res.header(), res.sendStatus(), res.send()) in handlers —
 * they don't exist on Vercel's response object and will crash at runtime.
 */
export interface ApiRequest {
  method?: string
  url?: string
  // Loose on purpose: Express types this as ParsedQs, Vercel as a string map.
  // Handlers narrow with `as string` at the point of use.
  query: Record<string, any>
}

export interface ApiResponse {
  setHeader(name: string, value: string | number | readonly string[]): unknown
  status(code: number): ApiResponse
  json(body: unknown): unknown
  end(chunk?: unknown): unknown
  headersSent: boolean
}
