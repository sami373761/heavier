/**
 * Lightweight persistence for user preferences (language, unit). Every access
 * is guarded: storage can be unavailable or full, and a preference is never
 * important enough to break the app over.
 */
export function readStoredPreference<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = localStorage.getItem(key)
    return isValid(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeStoredPreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore: preferences simply won't persist this session.
  }
}
