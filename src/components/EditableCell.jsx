import { useEffect, useRef, useState } from 'react'
// Checks and cleans what the user typed. Returns { value } or { error }.
export const FIELDS = {
  person: {
    label: 'Contact person name', placeholder: 'Add contact person',
    check: (v) => (v.trim() ? { value: v.trim().replace(/\s+/g, ' ') } : { error: 'Enter a contact person name' }),
  },
  email: {
    label: 'Contact email', placeholder: 'Add email', type: 'email',
    check: (v) => {
      const t = v.trim()
      if (!t) return { value: '' } // clearing is allowed, email switches turn off
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? { value: t } : { error: 'Enter a valid email, for example name@company.com' }
    },
  },
  mobile: {
    label: 'Contact mobile no.', placeholder: 'Add mobile no.', type: 'tel',
    check: (v) => {
      const d = v.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
      if (!d) return { value: '' } // clearing is allowed, WhatsApp switches turn off
      return /^[6-9]\d{9}$/.test(d) ? { value: `${d.slice(0, 5)} ${d.slice(5)}` } : { error: 'Enter a 10-digit mobile number' }
    },
  },
}

// A table cell you click to edit. Enter or clicking away saves, Esc cancels.
export default function EditableCell({ field, value, label, onSave, onInvalid }) {
  const f = FIELDS[field]
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  const [error, setError] = useState('')
  const ref = useRef(null)

  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select() } }, [editing])

  const start = () => { setText(value); setError(''); setEditing(true) }
  const cancel = () => { setEditing(false); setError('') }
  const commit = (fromBlur) => {
    const r = f.check(text)
    if (r.error) {
      if (fromBlur) { cancel(); onInvalid?.(r.error) } else setError(r.error)
      return
    }
    setEditing(false); setError('')
    if (r.value !== value) onSave(r.value)
  }

  if (!editing) {
    return (
      <button className="editable" onClick={start} aria-label={`Edit ${f.label} for ${label}`} title={value || undefined}>
        {value ? <span className="trunc">{value}</span> : <span className="nomiss">{f.placeholder}</span>}
      </button>
    )
  }
  return (
    <div className="editbox">
      <input ref={ref} className={`editinput ${error ? 'bad' : ''}`} type={f.type === 'email' ? 'email' : 'text'} inputMode={f.type === 'tel' ? 'tel' : undefined}
        value={text} placeholder={f.placeholder} aria-label={`${f.label} for ${label}`} aria-invalid={!!error}
        onChange={(e) => { setText(e.target.value); setError('') }}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(false); else if (e.key === 'Escape') cancel() }}
        onBlur={() => commit(true)} />
      {error && <div className="editerr" role="alert">{error}</div>}
    </div>
  )
}
