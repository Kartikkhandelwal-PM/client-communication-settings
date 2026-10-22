import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSettings, saveSettings } from '../api/settings.js'
import { KEYS, TEST_CLIENT, hasContact, makeClient } from '../api/mockData.js'

const keyOf = (id) => KEYS.find((k) => k.k === id)
const clone = (s) => ({ ...s, clients: s.clients.map((c) => ({ ...c, v: { ...c.v } })), defaults: { ...s.defaults } })

// All page data and edits. Every change is saved on its own a moment after it is made (no Save button).
// `saveInfo` changes after each save: { n, error } so the page can show "Saved" or an error.
export default function useSettings() {
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [saveInfo, setSaveInfo] = useState(null)
  const loaded = useRef(false)

  useEffect(() => {
    fetchSettings()
      .then((s) => { setState(s); loaded.current = false })
      .catch((e) => setError(e.message))
  }, [])

  // save shortly after the last change; the first render after loading is not a change
  useEffect(() => {
    if (!state) return
    if (!loaded.current) { loaded.current = true; return }
    const t = setTimeout(() => {
      saveSettings({ clients: state.clients.map(({ id, v, person, email, mobile }) => ({ id, v, person, email, mobile })), defaults: state.defaults })
        .then(() => setSaveInfo({ at: Date.now() }))
        .catch((e) => setSaveInfo({ at: Date.now(), error: e.message }))
    }, 400)
    return () => clearTimeout(t)
  }, [state])

  const edit = useCallback((fn) => setState((s) => fn(clone(s))), [])

  // turn one setting on or off for the given clients (skips clients with no contact for that channel)
  const setMany = useCallback((ids, keyId, on) => {
    const key = keyOf(keyId), set = new Set(ids)
    let n = 0
    edit((s) => {
      s.clients.forEach((c) => { if (set.has(c.id) && hasContact(c, key)) { c.v[keyId] = on; n++ } })
      return s
    })
    return n
  }, [edit])

  // whole set at once: 'on', 'off' or 'defaults'
  const setAll = useCallback((ids, keys, how) => {
    const set = new Set(ids)
    edit((s) => {
      s.clients.forEach((c) => {
        if (!set.has(c.id)) return
        keys.forEach((x) => { c.v[x.k] = hasContact(c, x) && (how === 'defaults' ? !!s.defaults[x.k] : how === 'on') })
      })
      return s
    })
  }, [edit])

  // change a contact detail. Taking away an email or mobile number turns off the settings that need it.
  const setContact = useCallback((id, field, value) => {
    edit((s) => {
      const c = s.clients.find((z) => z.id === id)
      c[field] = value
      KEYS.forEach((x) => { if (!hasContact(c, x)) c.v[x.k] = false })
      return s
    })
  }, [edit])

  const setDefault = useCallback((keyId, on) => edit((s) => ({ ...s, defaults: { ...s.defaults, [keyId]: on } })), [edit])

  // prototype helper: pretend Client Master just sent a new client. It gets the defaults straight away.
  const addTestClient = useCallback(() => {
    edit((s) => {
      const c = makeClient(TEST_CLIENT)
      KEYS.forEach((x) => { c.v[x.k] = !!s.defaults[x.k] && hasContact(c, x) })
      return { ...s, clients: [c, ...s.clients] }
    })
  }, [edit])

  return { state, error, saveInfo, setMany, setAll, setContact, setDefault, addTestClient }
}
