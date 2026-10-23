import { ROWS, sampleRows } from './mockData.js'

// WhatsApp logs (sample data). Every message goes out through Rampwin; the real fields still have to be
// matched with Rampwin's API / webhook (see DATA-SOURCES.md).
//
// Bulk messages: anything that goes to everyone at a scheduled time (the 2B Report, some update notifications).
// A "run" is one go at it, for example the 2B Report on one day. It records how many
// clients were targeted that day and what happened to each message.
export const STATUSES = {
  delivered: { label: 'Delivered', tone: 'green', help: 'Reached the client\'s phone' },
  read: { label: 'Read', tone: 'blue', help: 'The client opened the message' },
  sent: { label: 'Sent', tone: 'amber', help: 'Left WhatsApp, not on the client\'s phone yet (one tick)' },
  failed: { label: 'Failed', tone: 'red', help: 'Could not be delivered' },
  skipped: { label: 'Skipped', tone: 'gray', help: 'Not sent, for example no valid WhatsApp number' },
}
export const STATUS_ORDER = ['delivered', 'read', 'sent', 'failed', 'skipped']
export const MESSAGES = [
  { value: '2b', label: '2B report', trigger: 'Scheduled' },
  { value: 'upd', label: 'Update alert', trigger: 'Update alert' },
]
// DEMO. Update notifications that go to EVERYONE at a scheduled time, so they are bulk runs like the 2B Report.
// The real list has to come from the domain / dev team.
export const EVENTS = [
  { value: 'gstr2b', label: 'GSTR-2B data updated' },
  { value: 'due', label: 'Return due date reminder' },
]
export const SCHEDULED_EVENT = '2B Report'
// DEMO. Messages that go to ONE client when something happens or is completed (the Send button, or the GST app).
export const SINGLE_EVENTS = ['2B Report', 'New GST notice received', 'Tally data synced', 'ITC mismatch found', 'GSTR-1 filing completed', 'GSTR-3B filing completed', 'Notice reply submitted', 'Payment received']
export const RETENTION_DAYS = 60
export const REASONS = [
  'Number is not on WhatsApp', 'Client has not opted in', 'Message template rejected', 'Phone switched off for a long time', 'Rate limit reached, try later',
]

// small seeded random so the same run always shows the same messages
const seeded = (seed) => { let s = seed % 2147483647 || 1; return () => ((s = (s * 48271) % 2147483647) / 2147483647) }
const pad = (n) => String(n).padStart(2, '0')

const people = [...ROWS.map((r) => [r[0], r[5], r[1]]), ...sampleRows(700).map((r) => [r[0], r[5], r[1]])] // name, mobile, GSTIN
const NOW = new Date()

function makeRuns() {
  const rnd = seeded(11)
  const runs = []
  for (let d = 0; d < RETENTION_DAYS; d++) {
    const day = new Date(NOW); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - d)
    const add = (msg, hour, min, event = '') => {
      const at = new Date(day); at.setHours(hour, min, Math.floor(rnd() * 60))
      if (at > NOW) return
      const targeted = Math.floor(180 + rnd() * 340)
      const skipped = Math.round(targeted * (0.01 + rnd() * 0.04))
      const submitted = targeted - skipped
      const fresh = (NOW - at) < 3 * 3600e3
      const sent = fresh ? Math.round(submitted * (0.1 + rnd() * 0.25)) : Math.round(submitted * rnd() * 0.01)
      const failed = Math.round(sent * (0.01 + rnd() * 0.04))
      const rest = submitted - sent - failed
      const read = Math.round(rest * (fresh ? 0.2 : 0.55 + rnd() * 0.25))
      runs.push({ msg, event, at, targeted, skipped, submitted, sent, failed, read, delivered: rest - read })
    }
    add('2b', 10, 0)
    EVENTS.forEach((e, i) => { if (rnd() < 0.14) add('upd', 9 + i * 4, Math.floor(rnd() * 55), e.value) })
  }
  runs.sort((a, b) => b.at - a.at)
  runs.forEach((r, i) => { r.id = `WR-${200 - i}`; r.rate = r.submitted ? Math.round(((r.delivered + r.read) / r.submitted) * 100) : 0 })
  return runs
}
const RUNS = makeRuns()

// every message of one run, with a status that adds up to the run's numbers
export function runMessages(run) {
  const rnd = seeded(run.id.split('-')[1] * 97)
  const list = []
  for (const [status, n] of [['read', run.read], ['delivered', run.delivered], ['sent', run.sent], ['failed', run.failed], ['skipped', run.skipped]]) {
    for (let i = 0; i < n; i++) list.push(status)
  }
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]] }
  const offset = Math.floor(rnd() * people.length) // each client appears once in a run
  return list.map((status, i) => {
    const [client, mobile, gstin] = people[(i + offset) % people.length]
    const sentAt = new Date(run.at.getTime() + Math.floor(i * 400 + rnd() * 400))
    const delivered = status === 'delivered' || status === 'read' ? new Date(sentAt.getTime() + 2000 + rnd() * 90e3) : null
    return {
      id: `${run.id}-${i + 1}`, client, gstin, mobile: mobile || '98250 00000', status,
      sentAt: status === 'skipped' ? null : sentAt, deliveredAt: delivered,
      readAt: status === 'read' ? new Date(delivered.getTime() + 60e3 + rnd() * 5 * 3600e3) : null,
      reason: status === 'failed' ? REASONS[Math.floor(rnd() * REASONS.length)] : status === 'skipped' ? 'No valid WhatsApp number' : '',
    }
  })
}

// single messages: the "send now" clicks made on the settings page are added here
const SINGLES = (() => {
  const rnd = seeded(5)
  return Array.from({ length: 24 }, (_, i) => {
    const [client, mobile, gstin] = people[Math.floor(rnd() * people.length)]
    const at = new Date(NOW.getTime() - (i * 5 + rnd() * 5) * 3600e3)
    const status = rnd() < 0.6 ? 'read' : rnd() < 0.7 ? 'delivered' : rnd() < 0.5 ? 'sent' : 'failed'
    const delivered = status === 'delivered' || status === 'read' ? new Date(at.getTime() + 8000) : null
    const event = SINGLE_EVENTS[Math.floor(rnd() * SINGLE_EVENTS.length)]
    return { id: `WS-${500 - i}`, client, gstin, mobile: mobile || '98250 00000', event, by: event === '2B Report' ? ['Neha Gupta', 'Rahul Verma', 'Amit Shah'][i % 3] : 'System',
      status, sentAt: at, deliveredAt: delivered, readAt: status === 'read' ? new Date(at.getTime() + 3600e3) : null,
      reason: status === 'failed' ? REASONS[Math.floor(rnd() * REASONS.length)] : '' }
  })
})()
let singleSeq = 501
export function addSingleLog({ client, gstin, mobile, event }) {
  SINGLES.unshift({ id: `WS-${singleSeq++}`, client, gstin, mobile, event, by: 'You', status: 'sent', sentAt: new Date(), deliveredAt: null, readAt: null, reason: '' })
}

// Stand-ins for the real endpoints
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
export async function fetchRuns() { await wait(150); return RUNS }
export async function fetchSingles() { await wait(100); return [...SINGLES] }

// Trigger event = what caused the message, named like the events in Email Logs
export const eventLabel = (r) => (r.msg === 'upd' ? EVENTS.find((e) => e.value === r.event)?.label : SCHEDULED_EVENT)
export const singleEvent = (s) => s.event
export const fmt = (d) => (d ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtSec = (d) => (d ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—')

export function toCsv(cols, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.map((c) => esc(c.label)).join(','), ...rows.map((r) => cols.map((c) => esc(c.value(r))).join(','))].join('\n')
}
export function downloadCsv(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}
