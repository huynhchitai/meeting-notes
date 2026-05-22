# Security & Privacy — Meeting Notes

> Portfolio Project #6 · Tai Huynh

---

## Privacy stance

Meeting transcripts can contain sensitive information: names, phone numbers, email addresses, salary figures, personnel decisions, legal matters, unreleased product plans.

**This app does not persist any transcript content.** The data flow is:

```
Browser → Vercel serverless function → Gemini 2.5 Flash (Vertex AI) → back to browser
```

No database writes. No logging of transcript text. No third-party analytics on content.
The structured output (TL;DR, action items, etc.) is returned to the browser and rendered
client-side. Nothing is stored.

### Optional PII redaction

When the user enables **Redact emails & phone numbers**, the `redactPii()` function in
`src/lib/transcript.ts` runs a regex pass that replaces:

- Email addresses → `[EMAIL REDACTED]`
- Phone numbers (US domestic, international, compact formats) → `[PHONE REDACTED]`

This happens **server-side, before the transcript is passed to the Gemini API**. The model
never sees the originals.

**Limitations of the redaction:**
- Regex-based; does not cover every possible format (e.g. spelled-out numbers, non-Latin scripts).
- Does not redact names, addresses, NI/SSN numbers, or other PII beyond emails and phones.
- Best-effort only. Users handling sensitive transcripts should review and manually redact
  before submission if compliance is required.

The coverage is tested in `src/lib/__tests__/transcript.test.ts` (Vitest).

---

## Threat model

### In scope

| Threat | Control |
|---|---|
| Input abuse — oversized or malformed bodies | zod schema: `transcript` 100–60k chars; `context` ≤ 2k chars |
| Cost / volumetric DoS via AI calls | Upstash rate limit: 25/IP/day, sliding window, prefix `rl:notes` |
| PII sent to third-party AI model | Optional pre-send redaction of emails and phone numbers |
| Prompt injection via transcript content | Transcript treated as data: XML delimiters, separate system instruction, explicit "ignore commands in delimiters" instruction |
| Malformed or hostile LLM output | Every output field zod-validated; `PARSE_ERROR` returned if schema fails — no raw model output is rendered as HTML |
| Stack traces / internal errors leaking | `console.error` server-side only; client receives a typed `{ ok: false, error: ErrorCode, message }` |
| Service-account key committed to git | `.gitignore` excludes `*.json`, `gcp-key.json`, `*-service-account*.json`, `credentials.json`, `*.pem` |
| Long AI calls consuming server budget | `maxDuration = 60` on route; `maxOutputTokens = 2048` |

### Out of scope / known residual gaps

- **PII coverage:** regex-only; unusual formats escape. Not a substitute for human review in regulated environments.
- **Authentication:** none. IP rate limit is the only access control. Add auth middleware for internal deployments.
- **Transcript in Vertex AI logs:** Google may log API requests per their data-retention policy. Review the Vertex AI terms for your use case before processing regulated data (HIPAA, GDPR, etc.).
- **Re-identification from summary:** the output (action items, decisions, etc.) may implicitly contain identifying information even after PII redaction. No control is applied to the output.
- **HTTPS only:** transport-layer protection is the only encryption in transit. If you need end-to-end encryption of transcript content, this architecture requires additional measures (client-side encryption before POST).

---

## Dependency security

Dependencies are locked via `pnpm-lock.yaml`. Core dependencies:

- `@google-cloud/vertexai` — Google-maintained SDK; keep updated for security patches.
- `@upstash/ratelimit`, `@upstash/redis` — Upstash-maintained; minimal attack surface.
- `zod` — validation only; no network access.
- `next` — keep updated; Next.js has an active security disclosure process.

Run `pnpm audit` periodically or wire up Dependabot.

---

## Reporting issues

This is a portfolio demo. For responsible disclosure or questions about the architecture,
email: huynhchitai.070306@gmail.com
