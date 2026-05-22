'use client';

import { useState, useRef } from 'react';
import type { SummarizeResponse } from '@/lib/types';

interface Props {
  onResult: (result: SummarizeResponse) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const SAMPLE_TRANSCRIPT = `[9:02 AM] Sarah Chen: Alright everyone, let's get started. We're here to finalize the Q3 product roadmap and address the support ticket backlog.

[9:03 AM] Marcus Webb: Thanks Sarah. Quick update — we shipped the dashboard redesign last Thursday. Initial metrics look good, 14% reduction in support tickets related to navigation.

[9:05 AM] Sarah Chen: Great news. Let's talk about what's next. I want us to prioritize the API rate limiting feature. We've had three enterprise clients ask about it this week.

[9:07 AM] Priya Nair: Agreed. I can have a technical spec ready by next Wednesday. The implementation should take about two sprints.

[9:09 AM] Marcus Webb: One concern — the mobile app refresh was promised to the beta group by end of month. Can we do both?

[9:11 AM] Sarah Chen: Good point. Let's do this: Priya writes the rate limiting spec, Marcus leads the mobile refresh, both delivered by EOD Friday July 19th. We do a single sprint planning on Monday to sequence properly.

[9:14 AM] Tom Okafor: On the support backlog — we have 47 open tickets, 12 are over 7 days old. I'd like to close the stale ones by end of week with a canned response and open a Notion doc for recurring issues.

[9:16 AM] Sarah Chen: Agreed. Tom, own that. Also, can you draft the Notion doc template and share with the team by Thursday?

[9:17 AM] Tom Okafor: On it.

[9:18 AM] Sarah Chen: Any blockers? No? Good. Let's wrap. Next sync is Monday 9am.`;

export default function SummarizeForm({ onResult, onLoading, isLoading }: Props) {
  const [transcript, setTranscript] = useState('');
  const [context, setContext] = useState('');
  const [redactPii, setRedactPii] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function loadSample() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setCharCount(SAMPLE_TRANSCRIPT.length);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (transcript.length < 100) {
      setError('Please paste a transcript of at least 100 characters.');
      return;
    }

    onLoading(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, context: context || undefined, redactPii }),
      });
      const data: SummarizeResponse = await res.json();
      onResult(data);
    } catch {
      onResult({
        ok: false,
        error: 'INTERNAL',
        message: 'Network error — please check your connection and try again.',
      });
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Transcript textarea */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="transcript"
            className="eyebrow"
          >
            Meeting Transcript
          </label>
          <button
            type="button"
            onClick={loadSample}
            className="folio text-accent hover:underline"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            load sample
          </button>
        </div>
        <textarea
          id="transcript"
          ref={textareaRef}
          className="transcript-area"
          placeholder="Paste your raw meeting transcript here — chat logs, Zoom captions, or typed notes…"
          rows={12}
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            setCharCount(e.target.value.length);
          }}
          maxLength={60_000}
          required
          aria-describedby="transcript-hint"
        />
        <div
          id="transcript-hint"
          className="flex justify-between"
        >
          <span className="folio">
            {charCount < 100
              ? `${100 - charCount} more characters needed`
              : charCount > 50_000
              ? `${charCount.toLocaleString()} chars — transcript will be truncated at 50,000`
              : null}
          </span>
          <span className="folio">
            {charCount.toLocaleString()} / 60,000
          </span>
        </div>
      </div>

      {/* Context (optional) */}
      <div className="flex flex-col gap-2">
        <label htmlFor="context" className="eyebrow">
          Context <span className="folio normal-case">(optional)</span>
        </label>
        <input
          id="context"
          type="text"
          className="w-full rounded-sm border px-3 py-2 text-sm outline-none transition-all"
          style={{
            borderColor: 'var(--rule)',
            backgroundColor: 'white',
            color: 'var(--ink)',
            fontFamily: 'var(--font-body)',
          }}
          placeholder="e.g. &ldquo;Weekly product sync, engineering team of 4&rdquo;"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          maxLength={2_000}
        />
      </div>

      {/* PII toggle */}
      <div className="result-card flex flex-col gap-2 !py-3">
        <label className="toggle-label">
          <span
            className="relative inline-block h-5 w-9 flex-shrink-0"
            aria-hidden="true"
          >
            <input
              type="checkbox"
              className="peer sr-only"
              checked={redactPii}
              onChange={(e) => setRedactPii(e.target.checked)}
              id="redact-pii"
            />
            <span
              className="absolute inset-0 rounded-full transition-colors"
              style={{
                backgroundColor: redactPii ? 'var(--accent)' : 'var(--ink-faint)',
                transition: 'background-color 150ms ease',
              }}
            />
            <span
              className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{
                transform: redactPii ? 'translateX(1rem)' : 'translateX(0)',
                transition: 'transform 150ms ease',
              }}
            />
          </span>
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>
            Redact emails &amp; phone numbers before sending
          </span>
        </label>
        <p className="text-xs" style={{ color: 'var(--ink-muted)', paddingLeft: '2.375rem' }}>
          When enabled, email addresses and phone numbers are masked to{' '}
          <span className="inline-code">[EMAIL REDACTED]</span> /{' '}
          <span className="inline-code">[PHONE REDACTED]</span> before the transcript
          leaves your browser. Nothing is stored server-side regardless.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p
          className="rounded-sm border px-3 py-2 text-sm"
          style={{
            borderColor: 'rgba(180, 40, 40, 0.3)',
            backgroundColor: 'rgba(180, 40, 40, 0.05)',
            color: '#8b2020',
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || transcript.length < 100}
        className="btn-primary self-start"
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            Summarizing…
          </>
        ) : (
          <>
            Summarize meeting
            <ArrowIcon />
          </>
        )}
      </button>
    </form>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
