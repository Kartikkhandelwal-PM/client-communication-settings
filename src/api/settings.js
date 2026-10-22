import { initialClients, INITIAL_DEFAULTS } from './mockData.js'

// Stand-ins for the real endpoints. Swap the bodies for fetch() calls; the shapes stay the same.
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function fetchSettings() {
  await wait(250)
  return { clients: initialClients(), defaults: INITIAL_DEFAULTS }
}

// payload: { clients: [{ id, v, person, email, mobile }], defaults }
export async function saveSettings(payload) {
  await wait(300)
  return { ok: true, saved: payload.clients.length }
}
