import { Popover, Switch, Icon, ChannelIcon } from './ui.jsx'
import { KEYS, TABS } from '../api/mockData.js'

// "New client defaults": every new client added from Client Master gets these settings straight away
export default function DefaultsPopover({ defaults, onDefault }) {
  return (
    <Popover width={390} align="right" button={({ onClick, open }) => (
      <button className="btn ghost" onClick={onClick} aria-expanded={open}>
        <Icon name="gear" size={16} />New client defaults
      </button>
    )}>
      {() => (
        <div className="defpop">
          <div className="hd"><b>New client defaults</b><span className="small muted">Every new client added from Client Master gets these settings automatically. Turn a setting on or off for them here.</span></div>
          {TABS.map((t) => (
            <section key={t.id}>
              <h4>{t.label}</h4>
              {KEYS.filter((x) => x.tab === t.id).map((x) => (
                <div className="row" key={x.k}>
                  <div className="l"><b><ChannelIcon ch={x.ch} size={18} />{x.name}</b>{!x.named && <small>{x.sub}</small>}</div>
                  <Switch checked={!!defaults[x.k]} wa={x.ch === 'wa'} onChange={(on) => onDefault(x.k, on)} label={`${x.name} for new clients`} />
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </Popover>
  )
}
