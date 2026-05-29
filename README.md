# Meeting Notes

Paste a meeting transcript — get a clean summary, decisions, action items, and a follow-up email.

> Portfolio Project #6 · [Tai Huynh](https://github.com/huynhchitai)

---

## Demo

Paste any raw meeting transcript — Zoom captions, Teams chat logs, typed notes. Try the sample built into the UI:

```
[9:02 AM] Sarah Chen: Alright, let's finalize the Q3 roadmap…
[9:05 AM] Marcus Webb: API rate limiting is the priority this sprint…
…
```

The app returns:
- **TL;DR** — 1–3 sentence executive summary
- **Key points** — ranked discussion topics
- **Decisions made** — explicit agreements reached
- **Action items** — task, owner, and due date for each
- **Follow-up email** — professional draft ready to copy and send

Enable **Redact emails & phone numbers** before submitting if your transcript contains PII you'd rather not send to the model.

---

## Stack

- **Framework** — Next.js 14, App Router, `src/` layout
- **Language** — TypeScript, `strict: true`
- **AI** — Vertex AI — Gemini 2.5 Flash (`@google-cloud/vertexai`), structured output
- **Validation** — zod 4 on every input and every LLM output
- **Rate limit** — Upstash Redis (`@upstash/ratelimit`) — 25/day per IP, graceful no-op
- **Styling** — Tailwind CSS 3, CSS variables, Lora + Karla + JetBrains Mono fonts
- **Tests** — Vitest — covers `redactPii()` and transcript utilities
- **Deploy** — Vercel

---

## Run locally

```bash
# 1. Install dependencies
pnpm install

# 2. Copy the env template and fill in your values
cp .env.example .env.local
# Edit .env.local: add GOOGLE_CLOUD_PROJECT, credentials, and optionally Upstash

# 3. Start the dev server
pnpm dev
# → http://localhost:3000
```

---

## Tests

```bash
pnpm test
# runs: src/lib/__tests__/transcript.test.ts
# covers: redactPii (emails, phones, combined), normalizeTranscript, prepareTranscript
```

---

## Pipeline at a glance

```
Browser
  │
  │  POST /api/summarize
  │  { transcript (100–60k chars), context?, redactPii? }
  ▼
┌──────────────────────────────────────────────────────┐
│  1. checkRate(ip)           Upstash 25/day sliding   │
│  2. zod.parse(body)         reject bad input early   │
│  3. normalizeTranscript()   CRLF, whitespace         │
│  4. redactPii()?            emails + phones masked   │
│  5. truncate at 50k chars   note appended to text    │
│  6. buildUserPrompt()       transcript = DATA        │
│  7. Gemini 2.5 Flash        responseSchema, temp=0   │
│  8. JSON.parse(response)                             │
│  9. summaryOutputSchema.parse()   zod validate       │
│ 10. return { ok, data, meta }                        │
└──────────────────────────────────────────────────────┘
  │
  ▼
{ tldr, keyPoints, decisions, actionItems[], followUpEmail }
```

---

## Security stance

**What's defended:**

| Threat | Mitigation |
|---|---|
| Input abuse / oversized transcripts | zod: 100–60,000 char range enforced at the boundary |
| Cost / DoS via AI calls | Rate limit: 25/IP/day, Upstash sliding window |
| PII in transcripts sent to Gemini | Optional `redactPii` step masks emails + phones before the model sees them |
| Prompt injection in transcript | Transcript wrapped in XML delimiters; system prompt sent separately; explicit instruction to ignore delimiters |
| LLM hallucination / malformed output | Every output field zod-validated; malformed output returns `PARSE_ERROR`, not a crash |
| Stack traces leaking to client | All internal errors logged server-side; client receives only typed error codes |
| Secrets in version control | Service-account keys in `.gitignore`; env vars documented in `.env.example` with no real values |
| Long-running AI calls timing out | `maxDuration = 60` on route; `maxOutputTokens = 2048` caps generation time |

**Known gaps:**

- **PII coverage is best-effort.** The regex approach covers common email and phone formats. Unusual formats (e.g. spelled-out phone numbers, obfuscated emails) will escape. Users should review transcripts before submission if PII is a concern.
- **Transcript is not encrypted in transit beyond HTTPS.** Gemini receives the (possibly redacted) transcript over Vertex AI's encrypted API. If you operate in a regulated environment, review Google's data-processing terms.
- **No authentication.** The rate limiter is the only access control. For internal tools, add NextAuth or Clerk in front of the route.
- **Single-tenant.** No per-user quotas; rate limit is per IP only.

---

## Known limits

- Transcripts over 50,000 characters are truncated from the end. A note is appended so the model knows. The first portion of a meeting is kept because it typically contains more context.
- Action item extraction is only as good as the transcript. If speakers don't explicitly assign tasks, the model may miss them or mark owner as "TBD".
- The follow-up email is capped at ~2,048 output tokens (~400 words). Very large meetings may get a more compressed email.
- DNS rebinding is not a concern here (no user-supplied URLs are fetched). The SSRF guard from `web-scraper` is intentionally absent.
