import type { DisputeRecord } from '../services/disputes'
import type { LanguageCode } from '../i18n/languages'

/**
 * The panel's calls to the server. Five of them, and nothing else.
 *
 * There is no session: `setAdminKey` is handed the key the login derived, and
 * every request carries it in `X-Admin-Key` for the server to hash and check.
 * That is why there are no login/logout/session endpoints, no cookie, and no
 * CSRF header — a request either carries the credential or it does not.
 *
 * Reading is one call. `getAdminData` returns the objects, the categories and
 * the dispute log together, because the panel wants all three the moment it
 * opens and three endpoints returning slices of one file was the abstraction,
 * not the feature.
 */

const BASE = `${import.meta.env.BASE_URL}api/admin`

/** One entry of items.json, in the shape the file actually stores. */
export interface AdminItem {
  id: string
  weight: number
  path: string
  category: string
  /**
   * Whether the two whole-dataset game modes may draw this object. Optional,
   * because an entry written before the field existed does not have it — read
   * it as `item.include_random !== false`, the same "absent means true" rule
   * the game and the server use.
   */
  include_random?: boolean
  names: Partial<Record<LanguageCode, string>>
}

export interface AdminCategory {
  key: string
  folder: string
  names: Partial<Record<LanguageCode, string>>
  builtIn?: boolean
  /** Whether the homepage gives this category a card. */
  showOnHome: boolean
}

export interface AdminData {
  items: AdminItem[]
  categories: AdminCategory[]
  disputes: DisputeRecord[]
}

/** Thrown for any non-2xx response, carrying the server's own message. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** True when the key was rejected and the panel should show the login again. */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }
}

/**
 * The derived key, held in memory only — never in storage, so closing the tab
 * is the logout.
 */
let adminKey = ''

export function setAdminKey(key: string): void {
  adminKey = key
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'X-Admin-Key': adminKey,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'The server did not respond.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && typeof (payload as { error?: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed (HTTP ${response.status}).`
    throw new ApiError(response.status, message)
  }
  return payload as T
}

/** Everything the panel reads: items.json, the category registry, the reports. */
export function getAdminData(): Promise<AdminData> {
  return request('/data')
}

export interface NewObjectInput {
  id: string
  weight: number
  category: string
  include_random: boolean
  names: Record<LanguageCode, string>
  svg: string
}

export function createObject(input: NewObjectInput): Promise<{ object: AdminItem }> {
  return request('/objects', { method: 'POST', body: JSON.stringify(input) })
}

export interface ObjectEdit {
  weight: number
  category: string
  include_random: boolean
  names: Record<LanguageCode, string>
}

export function updateObject(id: string, input: ObjectEdit): Promise<{ object: AdminItem }> {
  return request(`/objects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function createCategory(
  key: string,
  names: Record<LanguageCode, string>,
  showOnHome: boolean,
): Promise<{ category: AdminCategory }> {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify({ key, names, showOnHome }),
  })
}

/**
 * Flips one category's homepage visibility. The only field a category update
 * can change: its key and folder are referenced by every object in it and by
 * files already on disk.
 */
export function setCategoryVisibility(
  key: string,
  showOnHome: boolean,
): Promise<{ category: AdminCategory }> {
  return request(`/categories/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify({ showOnHome }),
  })
}
