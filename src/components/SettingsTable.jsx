import { Switch, Popover, Icon, ChannelIcon } from './ui.jsx'
import EditableCell from './EditableCell.jsx'
import { hasContact } from '../api/mockData.js'

// off / on / mixed / none (nobody listed has the contact needed)
function columnState(key, rows) {
  const ok = rows.filter((c) => hasContact(c, key))
  if (!ok.length) return 'none'
  const on = ok.filter((c) => c.v[key.k]).length
  return on === 0 ? 'off' : on === ok.length ? 'on' : 'mixed'
}

export default function SettingsTable({ keys, rows, allRows, selected, onSelect, onSelectPage, onToggle, onEditContact, onInvalid, onToggleColumn }) {
  const allSel = rows.length > 0 && rows.every((c) => selected.has(c.id))
  const someSel = rows.some((c) => selected.has(c.id))
  const w = keys.length > 2 ? 165 : 200
  return (
    <table className="logs">
      <colgroup>
        <col style={{ width: 44 }} /><col style={{ width: 260 }} /><col style={{ width: 125 }} /><col style={{ width: 165 }} />
        <col style={{ width: 215 }} /><col style={{ width: 150 }} />{keys.map((x) => <col key={x.k} style={{ width: w }} />)}
      </colgroup>
      <thead>
        <tr>
          <th className="sel"><input className="cb" type="checkbox" checked={allSel} ref={(el) => el && (el.indeterminate = someSel && !allSel)} onChange={(e) => onSelectPage(e.target.checked)} aria-label="Select all clients on this page" /></th>
          <th>Client</th><th>Type</th><th>Contact Person Name</th><th>Contact Email</th><th>Contact Mobile No.</th>
          {keys.map((x) => {
            const ok = allRows.filter((c) => hasContact(c, x))
            const on = ok.filter((c) => c.v[x.k]).length
            return (
              <th key={x.k} className="c">
                <div className="colh">
                  <ChannelIcon ch={x.ch} size={22} />
                  <span className="nm">{x.name}<em>{x.sub}</em></span>
                  <Popover width={250} button={({ onClick, open }) => (
                    <button className={`fbtn ${open ? 'open' : ''}`} onClick={onClick} aria-expanded={open} aria-label={`Change ${x.name} for all listed clients`} title="Change for all listed clients">
                      <Icon name="chevron" size={14} />
                    </button>
                  )}>
                    {(close) => (
                      <div className="pop-list">
                        <div className="menu-title">{x.name} ({x.sub.toLowerCase()})</div>
                        <div className="small muted hint">{on} of {ok.length} listed clients have this on</div>
                        <button disabled={!ok.length || on === ok.length} onClick={() => { onToggleColumn(x, true); close() }}>Turn on for all {ok.length} listed</button>
                        <button disabled={!ok.length || on === 0} onClick={() => { onToggleColumn(x, false); close() }}>Turn off for all {ok.length} listed</button>
                      </div>
                    )}
                  </Popover>
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="sel">
              <input className="cb" type="checkbox" checked={selected.has(c.id)} onChange={(e) => onSelect(c.id, e.target.checked)} aria-label={`Select ${c.name}`} />
            </td>
            <td>
              <span className="title" title={c.name}>{c.name}</span>
              <div className="sub">{c.gstin}</div>
            </td>
            <td><span className="tag">{c.type}</span></td>
            {['person', 'email', 'mobile'].map((f) => (
              <td key={f} className="muted-cell edit-td">
                <EditableCell field={f} value={c[f]} label={c.name} onSave={(v) => onEditContact(c.id, f, v)} onInvalid={onInvalid} />
              </td>
            ))}
            {keys.map((x) => {
              const ok = hasContact(c, x)
              return (
                <td key={x.k} className="c" title={ok ? undefined : x.ch === 'wa' ? 'Add a mobile number to use WhatsApp' : 'Add an email address to use email'}>
                  <Switch checked={c.v[x.k]} disabled={!ok} wa={x.ch === 'wa'} label={`${x.name} for ${c.name}`} onChange={(on) => onToggle(c.id, x.k, on)} />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
