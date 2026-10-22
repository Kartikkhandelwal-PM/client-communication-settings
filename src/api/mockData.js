// Sample clients (fictional). Replace with the real Client Master data.
// Each setting key is one switch. `ch` is the channel it needs a contact for.
export const KEYS = [
  { k: 's2a',   name: 'GSTR-2A / 2B',       sub: 'Email',    ch: 'email', tab: 'rep', desc: 'Email the 2A / 2B report on schedule' },
  { k: 'tally', name: 'Tally data',         sub: 'Email',    ch: 'email', tab: 'rep', desc: 'Email the Tally data file on schedule' },
  { k: 'w2b',   name: '2B report',          sub: 'WhatsApp', ch: 'wa',    tab: 'rep', desc: 'Send the 2B summary on WhatsApp on schedule' },
  { k: 'nE',    name: 'Notify on email',    sub: 'Email',    ch: 'email', tab: 'upd', named: true, desc: 'Email the client when their data is updated' },
  { k: 'nW',    name: 'Notify on WhatsApp', sub: 'WhatsApp', ch: 'wa',    tab: 'upd', named: true, desc: 'WhatsApp the client when their data is updated' },
]

// `named` = the setting's name already says the channel, so the channel is not repeated next to it
export const fullName = (x) => (x.named ? x.name : `${x.name} (${x.sub.toLowerCase()})`)

export const TABS = [
  { id: 'rep', label: 'Scheduled Reports', icon: 'calendar' },
  { id: 'upd', label: 'Update Notification', icon: 'bell' },
]

// name, GSTIN, registration type, contact person, email, mobile, [s2a, tally, w2b, nE, nW]
const ROWS = [
  ['Bluestone Traders Private Limited', '24AABCB1234F1Z5', 'Regular', 'Anil Mehta', 'accounts@bluestone.example', '98250 11122', [1, 1, 0, 1, 0]],
  ['Kaveri Textiles', '33AAKFK5678L1ZP', 'Regular', 'Meena Raman', 'meena@kaveritex.example', '98946 22331', [1, 0, 0, 1, 1]],
  ['Orion Packaging LLP', '27AAOFO4321K1Z9', 'Regular', 'Sanjay Kulkarni', 'finance@orionpack.example', '99205 44418', [0, 0, 0, 0, 0]],
  ['Sharma Auto Spares', '07AAHPS9876M1ZQ', 'Composition', 'Rakesh Sharma', 'rakesh@sharmaauto.example', '93122 90001', [1, 1, 1, 1, 1]],
  ['Greenleaf Organics', '29AAGCG2468B1Z3', 'Regular', 'Divya Nair', 'hello@greenleaf.example', '98860 33210', [1, 1, 1, 0, 1]],
  ['Patel & Sons Hardware', '24AAEFP1357Q1Z8', 'Regular', 'Hitesh Patel', '', '98791 55002', [0, 1, 0, 0, 1]],
  ['Zenith Logistics Limited', '06AAZCZ8642D1Z1', 'Regular', 'Ritu Arora', 'ops@zenithlog.example', '99100 71234', [1, 0, 0, 1, 0]],
  ['Lotus Handicrafts', '08AALPL7531R1ZN', 'Composition', 'Kavita Joshi', 'lotus.craft@example.com', '', [0, 0, 1, 0, 1]],
  ['Nimbus Software Services', '36AANCN9513H1Z6', 'Regular', 'Arjun Reddy', 'billing@nimbus.example', '90300 11765', [1, 1, 1, 1, 1]],
  ['Harbor Foods Private Limited', '32AAHCH3579J1ZK', 'Regular', 'Thomas Mathew', 'tm@harborfoods.example', '94470 20045', [0, 0, 0, 1, 0]],
  ['Sai Ram Constructions', '37AASFS1593G1ZE', 'Regular', 'Venkat Rao', 'venkat@sairam.example', '98480 66012', [1, 0, 1, 1, 1]],
  ['Delta Pharma Distributors', '19AADCD7539E1ZB', 'Regular', 'Subhra Das', 'subhra@deltapharma.example', '98300 88211', [0, 1, 0, 0, 0]],
  ['Mahavir Jewellers', '27AAMFM2580P1Z4', 'Regular', 'Pooja Jain', 'pooja@mahavirjewels.example', '98190 44556', [1, 1, 0, 1, 1]],
  ['Crescent Interiors', '09AACFC6547N1ZT', 'Composition', 'Imran Khan', 'imran@crescent.example', '98370 12908', [0, 0, 0, 0, 0]],
]
export const hasContact = (c, key) => (key.ch === 'email' ? !!c.email : !!c.mobile)

let nextId = 1
export function makeClient([name, gstin, type, person, email, mobile, on]) {
  const c = { id: nextId++, name, gstin, type, person, email, mobile }
  c.v = Object.fromEntries(KEYS.map((x, i) => [x.k, !!on[i] && hasContact(c, x)]))
  return c
}

// Big sample list so paging, search and scrolling can be tried with thousands of clients (set to 0 for just the 14 above)
const SAMPLE_COUNT = 1500
const FIRST = ['Aarav', 'Bharat', 'Chandra', 'Devi', 'Eastern', 'Fortune', 'Gupta', 'Himalaya', 'Indus', 'Jai', 'Krishna', 'Lakshmi', 'Metro', 'Neelkanth', 'Omkar', 'Prime', 'Quality', 'Royal', 'Shree', 'Tulsi', 'Unity', 'Vishal', 'Western', 'Yash', 'Zenix']
const LAST = ['Traders', 'Enterprises', 'Industries', 'Textiles', 'Agencies', 'Foods', 'Motors', 'Pharma', 'Constructions', 'Logistics', 'Electricals', 'Steel Works', 'Services', 'Exports', 'Plastics']
const SUFFIX = ['', '', ' Private Limited', ' LLP', ' & Co', ' Limited']
const PEOPLE = ['Rahul Verma', 'Priya Iyer', 'Amit Shah', 'Neha Gupta', 'Karan Malhotra', 'Sunita Rao', 'Vikram Singh', 'Anjali Desai', 'Rohit Nair', 'Pooja Kapoor']
const STATES = ['24', '27', '29', '33', '06', '07', '09', '19', '32', '36']
function sampleRows(n) {
  let seed = 7
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const pick = (a) => a[Math.floor(rnd() * a.length)]
  return Array.from({ length: n }, (_, i) => {
    const name = `${pick(FIRST)} ${pick(LAST)}${pick(SUFFIX)}`
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14)
    const letters = (k) => Array.from({ length: k }, () => String.fromCharCode(65 + Math.floor(rnd() * 26))).join('')
    const gstin = `${pick(STATES)}${letters(5)}${String(1000 + (i * 7919) % 9000)}${letters(1)}1Z${Math.floor(rnd() * 9)}`
    const email = rnd() < 0.06 ? '' : `accounts${i}@${slug}.example`
    const mobile = rnd() < 0.06 ? '' : `9${Math.floor(1000 + rnd() * 8999)} ${Math.floor(10000 + rnd() * 89999)}`
    const on = Array.from({ length: 5 }, () => (rnd() < 0.45 ? 1 : 0))
    return [name, gstin, rnd() < 0.8 ? 'Regular' : 'Composition', pick(PEOPLE), email, mobile, on]
  })
}

export const initialClients = () => [...ROWS, ...sampleRows(SAMPLE_COUNT)].map((r) => makeClient(r))
export const TEST_CLIENT = ['Sunrise Medical Stores', '24AASFS9021K1ZB', 'Regular', 'Mehul Trivedi', 'mehul@sunrisemed.example', '98250 90210', [0, 0, 0, 0, 0]]

export const INITIAL_DEFAULTS = { s2a: true, tally: false, w2b: false, nE: true, nW: false }
