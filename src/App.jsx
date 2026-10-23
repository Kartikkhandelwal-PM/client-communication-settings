import { useEffect, useMemo, useRef, useState } from 'react'
import useSettings from './hooks/useSettings.js'
import { KEYS, TABS, fullName } from './api/mockData.js'
import { sendNow } from './api/settings.js'
import { addSingleLog } from './api/whatsappLogs.js'
import WhatsAppLogs from './components/WhatsAppLogs.jsx'
import { Icon, FilterButton, Pager, ChannelIcon, useToast } from './components/ui.jsx'
import SettingsTable from './components/SettingsTable.jsx'
import DefaultsPopover from './components/DefaultsPopover.jsx'

const PAGE_SIZES = [25, 50, 100]
const EMPTY = { q: '', reg: 'all', stat: 'all' }

// Two pages in one app, chosen by the link after the #. The settings page stays mounted (hidden) while
// the logs are open, so filters, the page you were on and your changes are still there when you come back.
export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => { setHash(window.location.hash); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const logs = hash.match(/^#\/whatsapp-logs(?:\/(.+))?$/)
  return (
    <>
      {logs && <WhatsAppLogs key={logs[1] || 'list'} runId={logs[1] ? decodeURIComponent(logs[1]) : null} />}
      <div hidden={!!logs}><SettingsPage /></div>
    </>
  )
}

function SettingsPage() {
  const s = useSettings()
  const [tab, setTab] = useState('rep')
  const [f, setF] = useState(EMPTY)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [selected, setSelected] = useState(new Set())
  const [toast, show] = useToast()
  const last = useRef({ msg: '', at: 0 })
  const say = (msg) => { last.current = { msg: msg.endsWith('.') ? msg : '', at: Date.now() }; show(msg) }

  const clients = s.state?.clients ?? []
  const keys = KEYS.filter((x) => x.tab === tab)

  const matchStat = {
    all: () => true,
    on: (c) => keys.some((x) => c.v[x.k]),
    off: (c) => !keys.some((x) => c.v[x.k]),
    miss: (c) => !c.email || !c.mobile,
  }
  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return clients.filter((c) =>
      (!q || [c.name, c.gstin, c.person, c.email, c.mobile].some((v) => v.toLowerCase().includes(q))) &&
      (f.reg === 'all' || c.type === f.reg) && matchStat[f.stat](c))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, f, tab])

  useEffect(() => setPage(0), [f, tab, pageSize])
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize)

  const count = (fn) => clients.filter(fn).length
  const regOptions = [{ value: 'all', label: 'All types', count: clients.length },
    ...['Regular', 'Composition'].map((t) => ({ value: t, label: t, count: count((c) => c.type === t) }))]
  const statOptions = [
    ['all', 'All clients'], ['on', 'Something turned on'], ['off', 'All turned off'], ['miss', 'Missing email or mobile'],
  ].map(([value, label]) => ({ value, label, count: count(matchStat[value]) }))


  const toggleOne = (id, key, on) => s.setMany([id], key, on)
  const toggleColumn = (x, on) => {
    const n = s.setMany(rows.map((c) => c.id), x.k, on)
    say(`${fullName(x)} turned ${on ? 'on' : 'off'} for ${n} clients.`)
  }
  const select = (id, on) => setSelected((p) => { const n = new Set(p); on ? n.add(id) : n.delete(id); return n })
  const selectPage = (on) => setSelected((p) => { const n = new Set(p); pageRows.forEach((c) => (on ? n.add(c.id) : n.delete(c.id))); return n })
  const bulkSelected = (keyId, on) => {
    const n = s.setMany([...selected], keyId, on)
    const x = KEYS.find((k) => k.k === keyId)
    const skipped = selected.size - n
    say(`${x.name} turned ${on ? 'on' : 'off'} for ${n} clients.${skipped ? ` ${skipped} skipped, no ${x.ch === 'wa' ? 'mobile number' : 'email'}.` : ''}`)
  }
  // "send now" for one client and one report. Works whatever the switch says. Nothing to confirm.
  const [sendState, setSendState] = useState({})
  const sendOne = async (c, x) => {
    const id = `${c.id}:${x.k}`
    setSendState((p) => ({ ...p, [id]: 'sending' }))
    const to = x.ch === 'wa' ? `WhatsApp ${c.mobile}` : c.email
    try {
      await sendNow({ clientId: c.id, key: x.k })
      if (x.ch === 'wa') addSingleLog({ client: c.name, gstin: c.gstin, mobile: c.mobile, event: x.name })
      setSendState((p) => ({ ...p, [id]: 'sent' }))
      say(`${x.name} sent to ${c.name} (${to}).`)
    } catch (e) {
      setSendState((p) => { const n = { ...p }; delete n[id]; return n })
      return say(`Could not send ${x.name} to ${c.name}: ${e.message}`)
    }
    setTimeout(() => setSendState((p) => { const n = { ...p }; delete n[id]; return n }), 2000)
  }

  // every change saves by itself; tell the user when it is done (or failed)
  // the "Saved" note is added to the message of the action that caused it, so the message is not lost
  useEffect(() => {
    if (!s.saveInfo) return
    if (s.saveInfo.error) return say(`Could not save: ${s.saveInfo.error}`)
    const recent = last.current.msg && Date.now() - last.current.at < 3000
    say(recent ? `${last.current.msg} Saved.` : 'Saved')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.saveInfo])
  const addTest = () => {
    s.addTestClient()
    say('A new client was added and your defaults were applied.')
  }

  if (s.error) return <main className="page"><div className="alert">Could not load settings: {s.error}</div></main>
  if (!s.state) return <main className="page"><div className="empty"><div className="spinner" />Loading settings…</div></main>

  return (
    <main className="page">
      <div className="crumbs"><a href="#">← Back to Client Master</a></div>
      <header className="top">
        <div>
          <h1><span className="titleicon"><Icon name="gear" size={20} /></span>Client Communication Settings</h1>
          <p className="muted">Choose which reports and update alerts each client gets, on email and WhatsApp.</p>
        </div>
      </header>

      <div className="controls">
        <div className="tabs" role="tablist" aria-label="Setting type">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={15} />{t.label}
            </button>
          ))}
        </div>
        <label className="searchbox">
          <Icon name="search" size={15} />
          <input className="search" type="search" placeholder="Search clients" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search clients" />
        </label>
        <FilterButton label="Registration type" icon="tag" value={f.reg} options={regOptions} onChange={(reg) => setF({ ...f, reg })} />
        <FilterButton label="Status" icon="status" value={f.stat} options={statOptions} onChange={(stat) => setF({ ...f, stat })} />
        <span className="vsep" aria-hidden="true" />
        <DefaultsPopover defaults={s.state.defaults} onDefault={s.setDefault} onTestClient={addTest} />
        <a className="btn ghost" href="#/whatsapp-logs"><ChannelIcon ch="wa" size={18} />WhatsApp Logs</a>
      </div>

      <section className="panel" aria-label="Clients">
        {selected.size > 0 && <SelectionBar keys={keys} count={selected.size} onApply={bulkSelected} onClear={() => setSelected(new Set())} />}
        <div className="panel-scroll">
          {rows.length > 0 && (
            <SettingsTable keys={keys} rows={pageRows} allRows={rows} selected={selected}
              onSelect={select} onSelectPage={selectPage} onToggle={toggleOne} onEditContact={s.setContact} onInvalid={say} onSend={sendOne} sendState={sendState} onToggleColumn={toggleColumn} />
          )}
        </div>
        {rows.length === 0 && <div className="empty"><b>No clients found</b><span className="muted">Try a different search or filter.</span></div>}
      </section>

      <Pager page={page} total={rows.length} pageSize={pageSize} sizes={PAGE_SIZES} onPage={setPage} onSize={setPageSize}
        info={rows.length !== clients.length ? `(filtered from ${clients.length})` : ''} />

      <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
    </main>
  )
}

// Appears above the table when rows are ticked: set one setting on or off for just those clients
function SelectionBar({ keys, count, onApply, onClear }) {
  const [key, setKey] = useState(keys[0].k)
  const valid = keys.some((x) => x.k === key) ? key : keys[0].k
  return (
    <div className="selbar">
      <b>{count} selected</b>
      <span className="muted">Turn</span>
      <select value={valid} onChange={(e) => setKey(e.target.value)} aria-label="Setting to change">
        {keys.map((x) => <option key={x.k} value={x.k}>{fullName(x)}</option>)}
      </select>
      <button className="btn" onClick={() => onApply(valid, true)}>On</button>
      <button className="btn ghost" onClick={() => onApply(valid, false)}>Off</button>
      <span className="grow" />
      <button className="link" onClick={onClear}>Clear selection</button>
    </div>
  )
}
