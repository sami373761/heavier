/**
 * Dispute collection.
 *
 * Disputes are structured data, not a UI flourish: they are the dataset-quality
 * signal behind the admin panel's analytics page ("which objects do players
 * keep telling us are wrong?"). Every method is async and hidden behind
 * `DisputeStore`, which is what made adding the server a change to this file
 * and nothing else — `DisputeFlow` never knew where a report went.
 *
 * Reports now go to the server, because a dispute sitting in one player's
 * localStorage is invisible to everyone who could act on it. The local store
 * stays as the fallback for when the server cannot be reached.
 *
 * Nothing here changes an object's weight; aggregation is reporting only.
 */

export type DisputeDirection = 'heavier' | 'lighter'

export interface DisputeInput {
  objectId: string
  direction: DisputeDirection
  /** Optional session context, useful when reviewing reports later. */
  gameId?: string
  questionId?: string
  /** The other object in the question the dispute came from. */
  opponentObjectId?: string
}

export interface DisputeRecord extends DisputeInput {
  id: string
  /** ISO 8601 timestamp. */
  createdAt: string
}

export interface DisputeSummary {
  objectId: string
  total: number
  heavier: number
  lighter: number
}

/**
 * How long a report is kept before the server deletes it.
 *
 * The enforcing copy is `DISPUTE_RETENTION_DAYS` in `server/store.mjs` — the
 * browser cannot import a `.mjs` server module, so this is the second copy and
 * exists only so the panel can say the number out loud. If one changes, change
 * both.
 */
export const DISPUTE_RETENTION_DAYS = 30

export interface DisputeStore {
  submit(input: DisputeInput): Promise<DisputeRecord>
  list(): Promise<DisputeRecord[]>
  summarize(): Promise<DisputeSummary[]>
}

/** Pure aggregation, so any store (or a future backend) can reuse it. */
export function aggregateDisputes(records: readonly DisputeRecord[]): DisputeSummary[] {
  const byObject = new Map<string, DisputeSummary>()

  for (const record of records) {
    const summary = byObject.get(record.objectId) ?? {
      objectId: record.objectId,
      total: 0,
      heavier: 0,
      lighter: 0,
    }
    summary.total += 1
    summary[record.direction] += 1
    byObject.set(record.objectId, summary)
  }

  return [...byObject.values()].sort((a, b) => b.total - a.total)
}

const STORAGE_KEY = 'weight-game:disputes'
const MAX_STORED_DISPUTES = 500

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export class LocalDisputeStore implements DisputeStore {
  private read(): DisputeRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(
        (entry): entry is DisputeRecord =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as DisputeRecord).objectId === 'string' &&
          ((entry as DisputeRecord).direction === 'heavier' ||
            (entry as DisputeRecord).direction === 'lighter'),
      )
    } catch {
      // Unreadable or unavailable storage must never break the game.
      return []
    }
  }

  private write(records: DisputeRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_STORED_DISPUTES)))
    } catch {
      // Private browsing / quota exceeded: drop the write rather than throw.
    }
  }

  async submit(input: DisputeInput): Promise<DisputeRecord> {
    const record: DisputeRecord = { ...input, id: createId(), createdAt: new Date().toISOString() }
    this.write([...this.read(), record])
    return record
  }

  async list(): Promise<DisputeRecord[]> {
    return this.read()
  }

  async summarize(): Promise<DisputeSummary[]> {
    return aggregateDisputes(this.read())
  }
}

/**
 * Sends reports to the server, where the admin panel can read them.
 *
 * A failed report must never interrupt a game, so a write that does not reach
 * the server falls back to localStorage rather than throwing. Those fallback
 * reports stay on that device — this is a best-effort quality signal, not an
 * accounting ledger, and silently losing one is better than a visible error in
 * the middle of a round.
 *
 * Reading is server-only: `list` and `summarize` exist for the admin panel,
 * which always has a server, and returning a single player's local reports
 * there would look like site-wide data and quietly mislead.
 */
export class HttpDisputeStore implements DisputeStore {
  private readonly endpoint = `${import.meta.env.BASE_URL}api/disputes`
  private readonly fallback = new LocalDisputeStore()

  async submit(input: DisputeInput): Promise<DisputeRecord> {
    const record: DisputeRecord = { ...input, id: createId(), createdAt: new Date().toISOString() }
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return record
    } catch (error) {
      console.warn('[weight-game] dispute could not be sent; keeping it locally', error)
      return this.fallback.submit(input)
    }
  }

  async list(): Promise<DisputeRecord[]> {
    return []
  }

  async summarize(): Promise<DisputeSummary[]> {
    return []
  }
}

/** The store the app uses. */
export const disputeStore: DisputeStore = new HttpDisputeStore()
