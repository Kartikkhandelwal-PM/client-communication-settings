# WhatsApp Logs: where each field comes from

The page runs on sample data (`src/api/whatsappLogs.js`). WhatsApp messages go out through **Rampwin**.
Nothing about Rampwin's API has been checked yet. This lists what the page needs, so each item can be
matched with a real Rampwin response.

Only messages sent from the Client Communication Settings page are logged.

- **Bulk messages:** anything that goes to everyone at a scheduled time: the **2B Report**, and any update
  notification that is sent to all clients together at a set time (demo: "GSTR-2B data updated", "Return due date
  reminder"). One run = one go at it. Targeted, submitted and status numbers are kept per run.
- **Single messages:** anything that goes to one client when something happens or is completed: the Send button,
  update alerts for one client, and messages the GST app sends when a task is completed.

The rule: sent together to many clients at one time = Bulk. Sent to one client for one event = Single.

**All trigger events on both tabs are demo data** (`EVENTS` and `SINGLE_EVENTS` in `src/api/whatsappLogs.js`).
The domain / dev team must give the real list of events and the plain-words name to show for each.

## KDK Software saves these itself (at send time)

| Field on the page | Note |
|---|---|
| Run ID (`WR-200`), message ID (`WR-200-1`), single ID (`WS-501`) | KDK creates them and saves them next to Rampwin's own message ID |
| Trigger event (2B Report, or the name of the event) | KDK knows which one it started |
| Run at | When KDK started the run |
| **Targeted** | Number of clients whose switch was on when the run started. Must be saved at that moment, because switches change later |
| **Skipped** (and its reason) | Clients targeted but not sent, for example no valid WhatsApp number. KDK decides this before calling Rampwin |
| Sent by (Send button only) | The user who clicked. Messages sent by the system show "System" |
| Client name, mobile no. | From Client Master at the time of sending |

## What Rampwin's documentation says (read on 23 Oct 2026)

Sources: [API reference](https://rampwin-api.readme.io/reference/api-authentication) (18 pages, index at
`https://rampwin-api.readme.io/llms.txt`), [help docs](https://docs.rampwin.com) (index at
`https://docs.rampwin.com/llms.txt`).

| Topic | What the docs say |
|---|---|
| Base URL, login | `https://api.rampwin.com`. Every request needs the header `X-API-Key` |
| Send a text message | `POST /api/messages/send` with `channel_id`, `phone_number` (with country code), `text`. Works only inside WhatsApp's 24-hour window ("Session expired" error otherwise) |
| Send a media message | Same endpoint with `file_url` (public link) |
| Send a template message | Page "Sending Template" only says to copy the cURL from the Rampwin app (Copy Template cURL). **The endpoint and body are not written in the docs.** Needed for the scheduled 2B Report, because a business-first message must use an approved template |
| **Send response** | `{ "success": true, "message": "Message sent successfully" }`. **No message ID and no status** is documented |
| Webhook setup | `POST /api/integrations/{channel_id}/setWebhook` with a public HTTPS `url` and `events`: `message_incoming`, `message_outgoing`, `message_status` (delivery and read updates), `template_update`, `channel_update`. One webhook per channel |
| **Webhook payload** | **Not documented.** No example of what a `message_status` event looks like |
| Statuses (Message History screen in the app) | **Send Status:** `PENDING`, `SENT`, `FAILED`, `NOT_ON_WHATSAPP`. **Read Status:** `TRIGGERED`, `DELIVERED`, `VIEWED` |
| Failure reasons, error codes | Not documented (only a few generic errors: Invalid API Key, Missing parameters, Invalid phone number, Session expired) |
| Limits (rate, size of a run) | Not documented |

## Still to confirm with Rampwin (ask their support)

1. **A message ID.** The send response has none. Without one, KDK cannot match a status update back to its own
   log row (`WR-200-1`). Ask: does the send response, or the template send, return an ID? Can we pass our own reference?
2. **The `message_status` webhook payload:** an example, the exact status values, and whether read and delivered
   times are included.
3. **The template send endpoint and body** (the cURL copied from the app), and what it returns.
4. **How Send Status and Read Status combine** into one status for the client (see the table below).
5. **Failure reasons** shown for `FAILED`, and whether `NOT_ON_WHATSAPP` arrives as its own status.
6. **Limits:** messages per second, and whether a run of 500 clients must be sent in batches.

## Status meanings on the page

These follow WhatsApp's own statuses (checked against
[Meta's status webhook reference](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status.md)).
Rampwin has its own statuses (Message History screen: Send Status `PENDING` / `SENT` / `FAILED` / `NOT_ON_WHATSAPP`, Read Status `TRIGGERED` / `DELIVERED` / `VIEWED`). Their webhook is not documented, so the mapping below is a proposal.

| Status on the page | WhatsApp status | Meaning |
|---|---|---|
| Sent | `sent` | Left WhatsApp's servers, not on the client's phone yet (one tick) |
| Delivered | `delivered` | Reached the client's phone (two ticks) |
| Read | `read` | The client opened the message (blue ticks) |
| Failed | `failed` | Could not be sent or delivered. Comes with an error code and text |
| Skipped | (ours, not a WhatsApp status) | Not sent to Rampwin, for example no valid WhatsApp number |

Things to handle:

- If the client reads the message at once, WhatsApp skips the `delivered` webhook and sends only `read`. Read always means delivered too.
- If the client turned off read receipts, the message stays "Delivered" even when read.
- Webhooks can arrive in any order (for example `delivered` after `failed`). Do not rely on the order.
- Rampwin may add its own statuses (for example queued or accepted). Map them when we get its documentation.

Numbers on the run page always add up: Targeted = Submitted + Skipped, and
Submitted = Sent + Delivered + Read + Failed.

## Proposed mapping from Rampwin to the page (to confirm)

| Rampwin | Status on the page |
|---|---|
| Send Status `PENDING` | Pending (waiting to be sent to WhatsApp) |
| Send Status `SENT`, Read Status `TRIGGERED` | Sent |
| Read Status `DELIVERED` | Delivered |
| Read Status `VIEWED` | Read |
| Send Status `FAILED` | Failed (with the reason) |
| Send Status `NOT_ON_WHATSAPP` | Failed, reason "Number is not on WhatsApp" |
| (our own check, never sent to Rampwin) | Skipped, for example no mobile number |

Note: the page used "Pending" earlier and was renamed "Sent" to match Meta's names. Rampwin has both `PENDING` and
`SENT`, so "Pending" should probably come back as a separate status.
