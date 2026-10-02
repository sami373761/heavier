import { useMemo } from 'react'
import type { AdminItem } from '../api'
import {
  DISPUTE_RETENTION_DAYS,
  aggregateDisputes,
  type DisputeRecord,
  type DisputeSummary,
} from '../../services/disputes'
import { formatWeight } from '../../domain/units'

/**
 * What players are telling you about the dataset.
 *
 * Every number here comes from `aggregateDisputes` — the game's own function,
 * imported rather than reimplemented, so there is exactly one definition of
 * what a "vote" counts as. It already returns `{ total, heavier, lighter }` per
 * object sorted by total, which is the ordering this page wants.
 *
 * The records arrive with everything else `AdminApp` loads and the aggregation
 * happens here, so this screen is a pure function of its props — which is also
 * what makes it renderable outside a browser.
 *
 * Everything shown is the **last 30 days**: the server deletes older reports
 * from `data/disputes.json` outright (see `pruneDisputes` in
 * `server/store.mjs`), so a count here can go down as well as up.
 */
export function AnalyticsScreen({
  items,
  disputes,
  onEditObject,
}: {
  items: AdminItem[]
  disputes: DisputeRecord[]
  onEditObject: (id: string) => void
}) {
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const rows = useMemo(() => aggregateDisputes(disputes), [disputes])
  const lastReportById = useMemo(() => lastReportTimes(disputes), [disputes])
  const totals = useMemo(() => countTotals(rows), [rows])
  const oldest = useMemo(() => oldestReport(disputes), [disputes])

  return (
    <section className="admin-section">
      <h2 className="admin-section__title">Analytics</h2>
      <p className="admin-note">
        Reports players filed after an answer was revealed: “this object looks heavier / lighter
        than the game says”. Most-reported first. Nothing here changes a weight — that is still
        your call.
      </p>
      <p className="admin-note">
        Reports are kept for {DISPUTE_RETENTION_DAYS} days and then deleted from the log for good,
        so these are the last {DISPUTE_RETENTION_DAYS} days only and a count can fall as old
        reports age out.
      </p>

      {rows.length === 0 && (
        <p className="admin-note">
          No reports in the last {DISPUTE_RETENTION_DAYS} days. They start arriving once players
          use the flag button during a game.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <p className="admin-note">
            <strong>{totals.total}</strong> report{totals.total === 1 ? '' : 's'} on{' '}
            <strong>{rows.length}</strong> object{rows.length === 1 ? '' : 's'} —{' '}
            {totals.heavier} heavier, {totals.lighter} lighter. Oldest still kept:{' '}
            {formatDay(oldest)}.
          </p>
          <DisputeTable
            rows={rows}
            byId={byId}
            lastReportById={lastReportById}
            onEditObject={onEditObject}
          />
        </>
      )}
    </section>
  )
}

/** When each object was last reported, so a stale row can be told from a live one. */
export function lastReportTimes(records: readonly DisputeRecord[]): Map<string, string> {
  const latest = new Map<string, string>()
  for (const record of records) {
    const seen = latest.get(record.objectId)
    if (!seen || record.createdAt > seen) latest.set(record.objectId, record.createdAt)
  }
  return latest
}

/** The window's own totals, summed from the per-object rows so they always agree. */
function countTotals(rows: readonly DisputeSummary[]) {
  return rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      heavier: acc.heavier + row.heavier,
      lighter: acc.lighter + row.lighter,
    }),
    { total: 0, heavier: 0, lighter: 0 },
  )
}

/** The oldest report still in the log — i.e. the one closest to being deleted. */
function oldestReport(records: readonly DisputeRecord[]): string {
  return records.reduce((oldest, record) => {
    if (!record.createdAt) return oldest
    return !oldest || record.createdAt < oldest ? record.createdAt : oldest
  }, '')
}

/** A date with no time: the panel is read daily, not by the minute. */
function formatDay(iso: string): string {
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return '—'
  return new Date(time).toISOString().slice(0, 10)
}

/** The counts themselves, split out so they can be rendered from plain data. */
export function DisputeTable({
  rows,
  byId,
  lastReportById,
  onEditObject,
}: {
  rows: DisputeSummary[]
  byId: Map<string, AdminItem>
  lastReportById: Map<string, string>
  onEditObject: (id: string) => void
}) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th scope="col">Object</th>
          <th scope="col">Current weight</th>
          <th scope="col" className="admin-table__number">
            Total
          </th>
          <th scope="col" className="admin-table__number">
            Heavier
          </th>
          <th scope="col" className="admin-table__number">
            Lighter
          </th>
          <th scope="col">Last report</th>
          <th scope="col">
            <span className="admin-visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const item = byId.get(row.objectId)
          return (
            <tr key={row.objectId}>
              <td>
                {item?.names.eng ?? row.objectId}
                {!item && <span className="admin-note"> (no longer in the dataset)</span>}
              </td>
              <td>{item ? formatWeight(item.weight, 'kg', 'eng').text : '—'}</td>
              <td className="admin-table__number">{row.total}</td>
              <td className="admin-table__number">{row.heavier}</td>
              <td className="admin-table__number">{row.lighter}</td>
              <td>{formatDay(lastReportById.get(row.objectId) ?? '')}</td>
              <td>
                {item && (
                  <button
                    className="admin-button"
                    type="button"
                    onClick={() => onEditObject(row.objectId)}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
