import { useEffect, useRef, useState } from 'react'

// Small line icons on a 16px grid (same set style as Email Logs)
const ICONS = {
  mail: <><rect x="2" y="3.5" width="12" height="9" rx="1.8" /><path d="M2.6 4.7 8 8.7l5.4-4" /></>,
  edit: <path d="M10.8 3.2 12.8 5.2M2.8 13.2l.6-2.6 7.4-7.4 2 2-7.4 7.4z" />,
  calendar: <><rect x="2.5" y="3.5" width="11" height="10" rx="1.8" /><path d="M2.5 6.8h11M5.5 2v3M10.5 2v3" /></>,
  bell: <><path d="M4 11V7.2a4 4 0 0 1 8 0V11l1.2 1.4H2.8z" /><path d="M6.6 14a1.5 1.5 0 0 0 2.8 0" /></>,
  search: <><circle cx="7" cy="7" r="4.2" /><path d="M10.3 10.3 13.6 13.6" /></>,
  chevron: <path d="M3.8 6.2 8 10.2l4.2-4" />,
  tag: <><path d="M2.5 8.3V3.5a1 1 0 0 1 1-1h4.8l5.2 5.2a1 1 0 0 1 0 1.4l-4.4 4.4a1 1 0 0 1-1.4 0z" /><circle cx="5.6" cy="5.6" r="1" /></>,
  status: <><circle cx="8" cy="8" r="5.6" /><path d="M5.6 8.2l1.7 1.7 3.2-3.4" /></>,
  layers: <><path d="M8 2.5 14 5.7 8 8.9 2 5.7z" /><path d="M2 9l6 3.2L14 9" /></>,
  gear: <><circle cx="8" cy="8" r="2" /><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1" /></>,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  up: <path d="M3.8 9.8 8 5.8l4.2 4" />,
  down: <path d="M3.8 6.2 8 10.2l4.2-4" />,
  sparkle: <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.6 1.6M10.4 10.4 12 12M12 4l-1.6 1.6M5.6 10.4 4 12" />,
  whatsapp: <path d="M8 2a6 6 0 0 0-5.2 9L2 14l3.1-.8A6 6 0 1 0 8 2z" />,
}
export const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ico">
    {ICONS[name]}
  </svg>
)

// Official brand glyphs (Simple Icons): Gmail envelope for email, WhatsApp logo for WhatsApp
const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
const MAIL_PATH = "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
export function ChannelIcon({ ch, size = 20 }) {
  const wa = ch === 'wa'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={wa ? 'WhatsApp' : 'Email'} className="chicon">
      <path d={wa ? WA_PATH : MAIL_PATH} fill={wa ? '#25D366' : '#EA4335'} />
    </svg>
  )
}

// Toggle. `mixed` shows a half-on state (used in column headers when only some rows are on).
export function Switch({ checked, mixed, disabled, wa, onChange, label, title }) {
  return (
    <label className={`sw ${wa ? 'wa' : ''} ${mixed ? 'mixed' : ''}`} title={title} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} disabled={disabled} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  )
}

// Fixed-position popover so a scrolling table cannot clip it.
// button({ onClick, open }) draws the trigger; children(close) draws the content.
export function Popover({ button, children, width = 240, align = 'left', onOpen }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    if (!pos) return
    const out = (e) => { if (!ref.current?.contains(e.target)) setPos(null) }
    const esc = (e) => e.key === 'Escape' && setPos(null)
    const close = () => setPos(null)
    const onScroll = (e) => { if (!ref.current?.contains(e.target)) setPos(null) }
    document.addEventListener('mousedown', out)
    window.addEventListener('keydown', esc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', out); window.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', close)
    }
  }, [pos])
  const toggle = (e) => {
    e.stopPropagation()
    if (pos) return setPos(null)
    const r = e.currentTarget.getBoundingClientRect()
    onOpen?.()
    const raw = align === 'right' ? r.right - width : r.left
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(raw, window.innerWidth - width - 12)) })
  }
  return (
    <span ref={ref} className="popwrap">
      {button({ onClick: toggle, open: !!pos })}
      {pos && <div className="pop" style={{ top: pos.top, left: pos.left, width }} onClick={(e) => e.stopPropagation()}>{children(() => setPos(null))}</div>}
    </span>
  )
}

// One-choice dropdown button for the toolbar: "Registration type" when nothing is picked
export function FilterButton({ label, icon, value, options, onChange }) {
  const picked = options.find((o) => o.value === value)
  const active = value !== options[0].value
  return (
    <Popover width={250} button={({ onClick, open }) => (
      <button className={`fbtn2 ${active ? 'on' : ''}`} onClick={onClick} aria-expanded={open}>
        {icon && <Icon name={icon} />}{active ? picked.label : label}<span className="chev"><Icon name="chevron" size={14} /></span>
      </button>
    )}>
      {(close) => (
        <div className="pop-list">
          {options.map((o) => (
            <button key={o.value} className={o.value === value ? 'sel' : ''} onClick={() => { onChange(o.value); close() }}>
              <span>{o.label}</span>{o.count != null && <span className="muted small">{o.count}</span>}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

export function Pager({ page, total, pageSize, onPage, onSize, sizes, noun = 'clients', info }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  return (
    <nav className="pager">
      <span className="muted small">{(page * pageSize + 1).toLocaleString()}–{Math.min(total, (page + 1) * pageSize).toLocaleString()} of {total.toLocaleString()} {noun}{info && <span className="muted"> {info}</span>}</span>
      <select value={pageSize} onChange={(e) => onSize(+e.target.value)} aria-label="Rows per page">
        {sizes.map((n) => <option key={n} value={n}>{n} per page</option>)}
      </select>
      <button className="btn ghost" disabled={page === 0} onClick={() => onPage(0)} aria-label="First page">«</button>
      <button className="btn ghost" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="small">Page {page + 1} of {pages.toLocaleString()}</span>
      <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</button>
      <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => onPage(pages - 1)} aria-label="Last page">»</button>
    </nav>
  )
}

export function useToast() {
  const [msg, setMsg] = useState('')
  const t = useRef()
  const show = (m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(''), 2800) }
  return [msg, show]
}
