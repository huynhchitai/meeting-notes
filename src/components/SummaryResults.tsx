'use client';

import { useState } from 'react';
import type { SummaryResult } from '@/lib/types';

interface Meta {
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  transcriptChars: number;
  truncated: boolean;
  piiRedacted: boolean;
}

interface Props {
  result: SummaryResult;
  meta: Meta;
}

export default function SummaryResults({ result, meta }: Props) {
  return (
    <div className="flex flex-col gap-6 reveal">
      {/* TL;DR */}
      <div className="result-card-accent">
        <span className="eyebrow-accent">TL;DR</span>
        <p
          className="mt-3 text-lg leading-relaxed"
          style={{
            fontFamily: 'var(--font-lora)',
            color: 'var(--ink)',
            fontStyle: 'italic',
          }}
        >
          {result.tldr}
        </p>
      </div>

      {/* Key Points + Decisions side by side on wider screens */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Key Points */}
        <div className="result-card">
          <span className="eyebrow">Key Points</span>
          <ul className="mt-3 flex flex-col gap-2">
            {result.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm"
                style={{ color: 'var(--ink-soft)' }}
              >
                <span
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full text-center text-xs font-bold leading-4"
                  style={{
                    backgroundColor: 'var(--parchment-dark)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                    minWidth: '1rem',
                  }}
                >
                  {i + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decisions */}
        <div className="result-card">
          <span className="eyebrow">Decisions Made</span>
          {result.decisions.length === 0 ? (
            <p className="mt-3 text-sm italic" style={{ color: 'var(--ink-faint)' }}>
              No explicit decisions recorded.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {result.decisions.map((decision, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  <span
                    style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '0.125rem',
                    }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{decision}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Action Items — timeline treatment */}
      <div className="result-card">
        <span className="eyebrow">Action Items</span>
        {result.actionItems.length === 0 ? (
          <p className="mt-3 text-sm italic" style={{ color: 'var(--ink-faint)' }}>
            No action items found.
          </p>
        ) : (
          <ol className="mt-4 flex flex-col gap-5">
            {result.actionItems.map((item, i) => (
              <li key={i} className="timeline-item">
                {/* Dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="timeline-dot" />
                  {/* connector line (visible except last) */}
                  {i < result.actionItems.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        width: '1px',
                        backgroundColor: 'var(--rule-soft)',
                        marginTop: '4px',
                      }}
                    />
                  )}
                </div>
                {/* Content */}
                <div className="pb-5">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    {item.task}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    <Pill icon="👤" label={item.owner} />
                    <Pill icon="📅" label={item.due} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Follow-up Email */}
      <FollowUpEmail email={result.followUpEmail} />

      {/* Meta footer */}
      <div
        className="flex flex-wrap gap-x-5 gap-y-1 border-t pt-3"
        style={{ borderColor: 'var(--rule-soft)' }}
      >
        <MetaBit label="duration" value={`${meta.durationMs}ms`} />
        <MetaBit label="tokens in" value={meta.inputTokens.toLocaleString()} />
        <MetaBit label="tokens out" value={meta.outputTokens.toLocaleString()} />
        <MetaBit label="transcript" value={`${meta.transcriptChars.toLocaleString()} chars`} />
        {meta.truncated && <MetaBit label="truncated" value="yes — 50k char cap" warn />}
        {meta.piiRedacted && <MetaBit label="PII redacted" value="yes" />}
      </div>
    </div>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
      style={{
        backgroundColor: 'var(--parchment-dark)',
        color: 'var(--ink-muted)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  );
}

function MetaBit({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <span
      className="folio"
      style={{ color: warn ? '#8b6020' : 'var(--ink-faint)' }}
    >
      {label}:{' '}
      <span style={{ color: warn ? '#8b6020' : 'var(--ink-muted)' }}>{value}</span>
    </span>
  );
}

function FollowUpEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  // Split subject line from body
  const lines = email.split('\n');
  const subjectLine = lines[0]?.startsWith('Subject:') ? lines[0] : null;
  const bodyText = subjectLine ? lines.slice(2).join('\n').trim() : email.trim();

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea
    }
  }

  return (
    <div className="result-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="eyebrow">Follow-up Email Draft</span>
          {subjectLine && (
            <p
              className="mt-1.5 text-sm font-semibold"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}
            >
              {subjectLine}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={copyEmail}
          className="btn-ghost !py-1.5 !text-xs"
          style={{ flexShrink: 0 }}
        >
          {copied ? (
            <>
              <CheckIcon /> Copied!
            </>
          ) : (
            <>
              <CopyIcon /> Copy
            </>
          )}
        </button>
      </div>

      <div
        className="rounded-sm border px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          backgroundColor: 'var(--notepad)',
          borderColor: 'var(--notepad-rule)',
          color: 'var(--ink-soft)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {bodyText}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 5V3.5A1.5 1.5 0 009.5 2h-7A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 8l3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
