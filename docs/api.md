# API and integrations

Mailflare exposes APIs for domain management and sending email. Authentication and mailbox permissions still apply to these routes.

## Domain management

Adding or removing a domain from Mailflare also updates Cloudflare Email Routing and sending resources.

| Mailflare route | Purpose |
| --- | --- |
| `GET /api/domains` | List connected domains |
| `POST /api/domains` | Connect a domain and configure Cloudflare |
| `GET /api/domains/[id]` | Get a connected domain |
| `DELETE /api/domains/[id]` | Remove a domain and clean up its Cloudflare resources |
| `GET /api/domains/[id]/dns` | View its routing and sending DNS status |

The hostname must be the apex of a zone available to the configured Cloudflare credentials, or a subdomain of that zone. Creating a mailbox also creates the Cloudflare Email Routing rule that delivers its address to the `mailflare` Worker.

## Sending email

Send email through `POST /api/v1/send`. `to`, `cc` and `bcc` accept either a comma-separated header string or an array of addresses; each entry may carry a display name (`"Maya Chen" <maya@example.net>`). A message can reach up to 50 recipients across the three fields. Attachments are optional and use Base64-encoded content:

```json
{
  "from": "support@example.com",
  "to": ["user@example.net", "\"Maya Chen\" <maya@example.net>"],
  "cc": "ops@example.com",
  "bcc": ["audit@example.com"],
  "subject": "Report",
  "text": "Attached.",
  "attachments": [
    {
      "filename": "report.pdf",
      "type": "application/pdf",
      "contentBase64": "<base64 data>"
    }
  ]
}
```

To send a reply that threads correctly in the recipient's client, pass the parent's Message-ID as `inReplyTo` and its chain as `references` (a header string or an array). Mailflare writes the `In-Reply-To` and `References` headers, files the sent copy in the same conversation, and stores `threadId`, `inReplyTo` and `references` on every message.

```json
{
  "from": "support@example.com",
  "to": "user@example.net",
  "subject": "Re: Report",
  "text": "Thanks, received.",
  "inReplyTo": "<CAF1abc@mail.example.net>",
  "references": ["<CAF0root@mail.example.net>", "<CAF1abc@mail.example.net>"]
}
```

`GET /api/messages/{id}/thread` (session auth) returns every stored message in the same conversation, oldest first, excluding drafts and trash. `GET /api/messages?group=thread` collapses a list to one row per conversation (its newest message matching the filter) and adds `threadCount`, `threadUnread` and `threadMessageIds`, the ids that row stands for within the current filter, so bulk actions can act on the whole conversation.

Messages composed in Mailflare are sent as HTML with a plain-text alternative derived from it. Quoted or forwarded content is wrapped in `<div class="mailflare-quote" data-mailflare-quote="1">` so the reader can fold it. `POST /api/drafts` accepts `forwardOfMessageId`, which copies that message's attachments onto the new draft; `DELETE /api/drafts/{id}/attachments/{attachmentId}` removes one, and `POST /api/send` with `draftId` sends the draft's stored files along with any uploaded in the request.

The dashboard composer accepts up to 10 attachments, with a 10 MB limit per file and a 20 MB combined limit. Attachment metadata is stored in D1 and file content is stored in R2. Downloads require access to the mailbox containing the message.

## Searching

`GET /api/messages?q=...` (session) and `GET /api/v1/messages?q=...` (API key, `read` scope) accept the same query grammar, backed by an FTS5 index over subject, sender, recipients and body:

| Syntax | Meaning |
|---|---|
| `invoice` | prefix match anywhere (`inv` finds "invoice") |
| `"private window"` | exact phrase |
| `-word` | exclude |
| `from:maya`, `to:sam`, `subject:report` | restrict a term to one field (`to:` covers Cc) |
| `has:attachment` | at least one non-inline attachment |
| `is:unread`, `is:read`, `is:starred` | flags |
| `after:2026-09-01`, `before:2026-09-30` | date bounds (UTC, `before` exclusive) |

Terms combine with AND. Admins can check or rebuild the index with `GET` / `POST /api/admin/search-index`; triggers keep it current, so a rebuild is only needed after restoring a backup made before the index existed.

## Real-time updates

Mailflare uses a Durable Object WebSocket hub to notify connected users after an inbound message is stored. Mailbox owners, the domain administrator, and delegated users receive events for mailboxes they can access.

The `REALTIME` binding and its migration are declared in `wrangler.jsonc`. When a WebSocket is temporarily unavailable, the app retries the connection and uses a slower refresh until it recovers.
