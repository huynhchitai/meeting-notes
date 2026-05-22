/**
 * transcript.ts — normalize and optionally redact meeting transcripts.
 *
 * Security note: PII redaction masks emails and phone numbers before the
 * transcript is sent to Gemini. This is best-effort; unusual formats may
 * escape. When `redactPii` is false, the raw transcript is sent — the user
 * is shown a clear privacy notice in the UI.
 *
 * Very long transcripts (> MAX_TRANSCRIPT_CHARS) are truncated from the END
 * before being sent to the model, and a note is appended. The first part of
 * a meeting typically contains more context-setting material; the end is more
 * likely to be closing small-talk.
 */

/** Hard cap on transcript characters sent to the model. */
export const MAX_TRANSCRIPT_CHARS = 50_000;

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalize a raw transcript:
 *   - Collapse runs of spaces/tabs to single space
 *   - Normalize Windows/Mac line endings to Unix
 *   - Collapse 3+ blank lines to 2 (keep paragraph structure)
 *   - Trim overall
 */
export function normalizeTranscript(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')      // CRLF → LF
    .replace(/\r/g, '\n')         // CR → LF
    .replace(/[ \t]+/g, ' ')      // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')   // collapse 3+ blank lines to 2
    .trim();
}

// ── PII Redaction ────────────────────────────────────────────────────────────

/**
 * Email addresses — RFC-5321 local part + domain.
 * Matches most common formats; deliberately conservative (avoids mangling
 * URLs that contain @ in query strings).
 */
const EMAIL_RE = /\b[A-Za-z0-9._%+\-]{1,64}@[A-Za-z0-9.\-]{1,253}\.[A-Za-z]{2,}\b/g;

/**
 * Phone numbers — covers:
 *   - International: +1 (555) 555-5555, +44 20 7946 0958
 *   - US domestic: (555) 555-5555, 555-555-5555, 555.555.5555
 *   - Compact: 5555555555
 *
 * Requires at least 7 digits total to avoid false positives on short numbers
 * like version strings (3.4.1) or dates (2024-01-15).
 */
const PHONE_RE =
  /(?:\+?[0-9]{1,3}[\s.\-]?)?(?:\(?[0-9]{2,4}\)?[\s.\-]?){1,2}[0-9]{3,4}[\s.\-]?[0-9]{3,4}(?!\d)/g;

/** Minimum digit count to consider a match a real phone number. */
const MIN_DIGITS = 7;

function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/**
 * Redact email addresses and phone numbers from `text`.
 * - Emails  → [EMAIL REDACTED]
 * - Phones  → [PHONE REDACTED]
 * All other text is left intact.
 */
export function redactPii(text: string): string {
  const withoutEmails = text.replace(EMAIL_RE, '[EMAIL REDACTED]');
  const withoutPhones = withoutEmails.replace(PHONE_RE, (match) => {
    if (countDigits(match) < MIN_DIGITS) return match;
    return '[PHONE REDACTED]';
  });
  return withoutPhones;
}

// ── Truncation ───────────────────────────────────────────────────────────────

/**
 * Prepare a transcript for sending to the model:
 *   1. Normalize whitespace
 *   2. Optionally redact PII
 *   3. Truncate to MAX_TRANSCRIPT_CHARS (from the end, appending a note)
 *
 * Returns the prepared string and whether truncation occurred.
 */
export function prepareTranscript(
  raw: string,
  opts: { redactPii?: boolean } = {}
): { text: string; truncated: boolean } {
  let text = normalizeTranscript(raw);

  if (opts.redactPii) {
    text = redactPii(text);
  }

  if (text.length <= MAX_TRANSCRIPT_CHARS) {
    return { text, truncated: false };
  }

  const truncated = text.slice(0, MAX_TRANSCRIPT_CHARS);
  const note =
    '\n\n[NOTE: Transcript was truncated at 50,000 characters. The final portion of the meeting is not included.]';
  return { text: truncated + note, truncated: true };
}
