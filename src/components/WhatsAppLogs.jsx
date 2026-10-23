import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Icon, FilterButton, Pager, ChannelIcon } from './ui.jsx'
import RunDetail from './RunDetail.jsx'
import { STATUSES, STATUS_ORDER, RETENTION_DAYS, EVENTS, SCHEDULED_EVENT, SINGLE_EVENTS, eventLabel, singleEvent, getUpcoming, subscribeUpcoming, nextRunAt, fetchRuns, fetchSingles, fmt, toCsv, downloadCsv } from '../api/whatsappLogs.js'

const PAGE_SIZES = [25, 50, 100]
const num = (n) => n.toLocaleString()

export const StatusBadge = ({ status }) => {
  const s = STATUSES[status]
  return <span className={`badge badge-${s.tone}`} title={s.help}>{s.label}</span>
}
const Count = ({ n, tone }) => (n ? <span className={tone ? `c-${tone}` : ''}>{num(n)}</span> : <span className="muted">0</span>)

// Page: list of runs (one per message type per day) and the single "send now" messages
export default function WhatsAppLogs({ runId }) {
  const [tab, setTab] = useState('runs')
  const [runs, setRuns] = useState([])
  const [singles, setSingles] = useState([])
  const [f, setF] = useState({ q: '', days: String(RETENTION_DAYS), msg: 'all', status: 'all', sev: 'all' })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const upcoming = useSyncExternalStore(subscribeUpcoming, getUpcoming)

  useEffect(() => { fetchRuns().then(setRuns); fetchSingles().then(setSingles) }, [runId])
  useEffect(() => setPage(0), [f, tab, pageSize])

  const midnight = new Date().setHours(0, 0, 0, 0)
  const since = f.days === '1' ? midnight : Date.now() - f.days * 86400e3
  const runRows = useMemo(() => runs.filter((r) =>
    r.at >= since && (f.msg === 'all' || (f.msg === '2b' ? r.msg === '2b' : r.event === f.msg.slice(3))) &&
    (!f.q.trim() || (r.id + eventLabel(r)).toLowerCase().includes(f.q.trim().toLowerCase()))),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [runs, f])
  const singleRows = useMemo(() => singles.filter((s) =>
    s.sentAt >= since && (f.status === 'all' || s.status === f.status) && (f.sev === 'all' || s.event === f.sev) &&
    (!f.q.trim() || (s.id + s.client + s.gstin + s.mobile + singleEvent(s)).toLowerCase().includes(f.q.trim().toLowerCase()))),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [singles, f])

  if (runId) return <RunDetail run={runs.find((r) => r.id === runId)} loading={!runs.length} />

  const rows = tab === 'runs' ? runRows : singleRows
  // the next scheduled 2B Report is shown at the top of the first page, unless a search or filter rules it out
  const showUpcoming = tab === 'runs' && (f.msg === 'all' || f.msg === '2b') && (!f.q.trim() || 'upcoming 2b report'.includes(f.q.trim().toLowerCase()))
  const slice = rows.slice(page * pageSize, (page + 1) * pageSize)

  const exportCsv = () => {
    const cols = tab === 'runs'
      ? [['ID', (r) => r.id], ['Trigger event', (r) => eventLabel(r)], ['Run at', (r) => fmt(r.at)], ['Targeted', (r) => r.targeted], ['Pending', (r) => r.pending], ['Sent', (r) => r.sent], ['Delivered', (r) => r.delivered], ['Read', (r) => r.read], ['Failed', (r) => r.failed]]
      : [['ID', (r) => r.id], ['Client', (r) => r.client], ['GSTIN', (r) => r.gstin], ['Mobile', (r) => r.mobile], ['Trigger event', (r) => singleEvent(r)], ['Sent by', (r) => r.by], ['Sent at', (r) => fmt(r.sentAt)], ['Status', (r) => STATUSES[r.status].label], ['Reason', (r) => r.reason]]
    downloadCsv(toCsv(cols.map(([label, value]) => ({ label, value })), rows), `whatsapp-${tab}.csv`)
  }

  return (
    <main className="page">
      <div className="crumbs"><a href="#/">← Back to Client Communication Settings</a></div>
      <header className="top">
        <div>
          <h1><span className="titleicon"><ChannelIcon ch="wa" size={22} /></span>WhatsApp Logs</h1>
          <p className="muted">WhatsApp messages sent to your clients and their status. Kept for {RETENTION_DAYS} days.</p>
        </div>
        <div className="topbtns"><button className="btn" onClick={exportCsv}><Icon name="download" size={16} />Export</button></div>
      </header>

      <div className="controls">
        <div className="tabs" role="tablist" aria-label="Log type">
          <button role="tab" aria-selected={tab === 'runs'} className={tab === 'runs' ? 'on' : ''} onClick={() => setTab('runs')}><Icon name="layers" size={15} />Bulk messages</button>
          <button role="tab" aria-selected={tab === 'single'} className={tab === 'single' ? 'on' : ''} onClick={() => setTab('single')}><Icon name="send" size={15} />Single messages</button>
        </div>
        <label className="searchbox">
          <Icon name="search" size={15} />
          <input className="search" type="search" placeholder={tab === 'runs' ? 'Search run ID or trigger event' : 'Search ID, client, GSTIN or event'} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search logs" />
        </label>
        {tab === 'runs' && <FilterButton label="Trigger event" icon="tag" value={f.msg} options={[{ value: 'all', label: 'All trigger events' }, { value: '2b', label: SCHEDULED_EVENT }, ...EVENTS.map((e) => ({ value: `ev:${e.value}`, label: e.label }))]} onChange={(msg) => setF({ ...f, msg })} />}
        {tab === 'single' && <FilterButton label="Trigger event" icon="tag" value={f.sev} options={[{ value: 'all', label: 'All trigger events' }, ...SINGLE_EVENTS.map((e) => ({ value: e, label: e }))]} onChange={(sev) => setF({ ...f, sev })} />}
        {tab === 'single' && <FilterButton label="Status" icon="status" value={f.status} options={[{ value: 'all', label: 'All statuses' }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUSES[s].label }))]} onChange={(status) => setF({ ...f, status })} />}
        <FilterButton label="Date" alwaysValue icon="calendar" value={f.days} options={[{ value: '60', label: 'Last 60 days' }, { value: '30', label: 'Last 30 days' }, { value: '7', label: 'Last 7 days' }, { value: '1', label: 'Today' }]} onChange={(days) => setF({ ...f, days })} />
      </div>

      <section className="panel" aria-label="WhatsApp logs">
        <div className="panel-scroll">
          {rows.length > 0 && tab === 'runs' && (
            <table className="logs flat" style={{ minWidth: 1260 }}>
              <colgroup><col style={{ width: 100 }} /><col style={{ width: 260 }} /><col style={{ width: 190 }} />{Array.from({ length: 6 }, (_, i) => <col key={i} style={{ width: 100 }} />)}<col style={{ width: 110 }} /></colgroup>
              <thead><tr><th>ID</th><th>Trigger event</th><th>Run at</th>
                <th className="r" title="Clients selected for this run (their switch was on)">Targeted</th>
                <th className="r" title="Waiting to be sent to WhatsApp">Pending</th><th className="r" title="Handed over to WhatsApp, not yet on the client's phone">Sent</th><th className="r">Delivered</th><th className="r">Read</th><th className="r">Failed</th><th className="r" title="Delivered or read, out of targeted">Reached</th></tr></thead>
              <tbody>
                {page === 0 && showUpcoming && (
                  <tr className="upcoming">
                    <td><span className="badge badge-blue">Upcoming</span></td>
                    <td><span className="title">{SCHEDULED_EVENT}</span></td>
                    <td className="muted-cell">{fmt(nextRunAt())}</td>
                    <td className="r num" title="Clients whose 2B Report switch is on right now. The final number is fixed when the run starts."><b>{upcoming.targeted == null ? '…' : num(upcoming.targeted)}</b></td>
                    {Array.from({ length: 6 }, (_, i) => <td key={i} className="r num muted">—</td>)}
                  </tr>
                )}
                {slice.map((r) => (
                  <tr key={r.id} className="click" onClick={() => { window.location.hash = `#/whatsapp-logs/${r.id}` }}>
                    <td className="idcell">{r.id}</td>
                    <td><span className="title" title={eventLabel(r)}>{eventLabel(r)}</span></td>
                    <td className="muted-cell">{fmt(r.at)}</td>
                    <td className="r num"><b>{num(r.targeted)}</b></td>
                    <td className="r num"><Count n={r.pending} /></td><td className="r num"><Count n={r.sent} tone="amber" /></td>
                    <td className="r num"><Count n={r.delivered} tone="green" /></td><td className="r num"><Count n={r.read} tone="blue" /></td>
                    <td className="r num"><Count n={r.failed} tone="red" /></td>
                    <td className="r num">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {rows.length > 0 && tab === 'single' && (
            <table className="logs flat" style={{ minWidth: 1580 }}>
              <colgroup><col style={{ width: 100 }} /><col style={{ width: 270 }} /><col style={{ width: 140 }} /><col style={{ width: 200 }} /><col style={{ width: 130 }} /><col style={{ width: 190 }} /><col style={{ width: 190 }} /><col style={{ width: 120 }} /><col style={{ width: 240 }} /></colgroup>
              <thead><tr><th>ID</th><th>Client</th><th>Mobile no.</th><th>Trigger event</th><th>Sent by</th><th>Sent at</th><th>Delivered at</th><th>Status</th><th>Reason</th></tr></thead>
              <tbody>
                {slice.map((s) => (
                  <tr key={s.id}>
                    <td className="idcell">{s.id}</td>
                    <td><span className="title" title={s.client}>{s.client}</span><div className="sub">{s.gstin}</div></td>
                    <td className="muted-cell">{s.mobile}</td><td className="muted-cell"><span className="trunc" title={singleEvent(s)}>{singleEvent(s)}</span></td><td className="muted-cell">{s.by}</td>
                    <td className="muted-cell">{fmt(s.sentAt)}</td><td className="muted-cell">{fmt(s.deliveredAt)}</td>
                    <td><StatusBadge status={s.status} /></td><td className="muted-cell"><span className="trunc" title={s.reason}>{s.reason || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {rows.length === 0 && <div className="empty"><b>No logs found</b><span className="muted">{tab === 'single' ? 'Messages sent to one client with the Send button on the settings page show up here.' : 'Try a different search, message or date range.'}</span></div>}
      </section>
      <Pager page={page} total={rows.length} pageSize={pageSize} sizes={PAGE_SIZES} noun={tab === 'runs' ? 'runs' : 'messages'} onPage={setPage} onSize={setPageSize} />
    </main>
  )
}
