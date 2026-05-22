'use client';

import { useState } from 'react';
import FolioBar from '@/components/FolioBar';
import SummarizeForm from '@/components/SummarizeForm';
import SummaryResults from '@/components/SummaryResults';
import type { SummarizeResponse } from '@/lib/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<SummarizeResponse | null>(null);

  function handleResult(res: SummarizeResponse) {
    setResponse(res);
    if (res.ok) {
      // Scroll to results after a brief tick
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  return (
    <>
      <FolioBar />

      <main className="mx-auto max-w-4xl px-5 pb-20 sm:px-8">
        {/* ── Hero ── */}
        <header className="py-14 sm:py-20">
          <div className="reveal">
            <span className="eyebrow-accent">Portfolio Project #6 · Tai Huynh</span>
          </div>

          <h1
            className="mt-4 reveal reveal-delay-1"
            style={{
              fontFamily: 'var(--font-lora)',
              fontSize: 'clamp(2.25rem, 7vw, 4.5rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              fontWeight: 700,
            }}
          >
            Turn messy meeting transcripts
            <br />
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>into clear minutes.</em>
          </h1>

          <p
            className="mt-5 max-w-2xl text-lg leading-relaxed reveal reveal-delay-2"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}
          >
            Paste a raw transcript — Zoom captions, Teams chat, or typed notes.
            Get a TL;DR, key discussion points, every decision made, action items
            with owners and due dates, and a ready-to-send follow-up email.
            Powered by Gemini 2.5 Flash.
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap gap-2 reveal reveal-delay-3">
            {[
              'TL;DR summary',
              'Key points',
              'Decisions',
              'Action items + owners',
              'Follow-up email',
              'Optional PII redaction',
            ].map((feat) => (
              <span
                key={feat}
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: 'var(--rule)',
                  backgroundColor: 'white',
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.02em',
                }}
              >
                {feat}
              </span>
            ))}
          </div>
        </header>

        {/* ── Rule ── */}
        <div className="rule-accent mb-1" />
        <div className="rule-thin mb-10" />

        {/* ── Input panel ── */}
        <section
          className="notepad-panel rounded-sm border p-6 sm:p-8 reveal reveal-delay-4"
          style={{ borderColor: 'var(--rule)' }}
          aria-label="Transcript input"
        >
          <h2
            className="mb-5 text-xl font-semibold"
            style={{
              fontFamily: 'var(--font-lora)',
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          >
            Paste your transcript
          </h2>
          <SummarizeForm
            onResult={handleResult}
            onLoading={setIsLoading}
            isLoading={isLoading}
          />
        </section>

        {/* ── Loading state ── */}
        {isLoading && (
          <section className="mt-10" aria-live="polite" aria-busy="true">
            <div className="flex flex-col gap-4">
              <LoadingSkeleton wide />
              <LoadingSkeleton />
              <div className="grid gap-4 sm:grid-cols-2">
                <LoadingSkeleton />
                <LoadingSkeleton />
              </div>
              <LoadingSkeleton wide />
            </div>
          </section>
        )}

        {/* ── Results ── */}
        {!isLoading && response && (
          <section id="results" className="mt-10" aria-label="Summary results" aria-live="polite">
            {response.ok ? (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rule-accent" style={{ maxWidth: '3rem' }} />
                  <h2
                    className="text-xl font-semibold"
                    style={{
                      fontFamily: 'var(--font-lora)',
                      color: 'var(--ink)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Meeting summary
                  </h2>
                </div>
                <SummaryResults result={response.data} meta={response.meta} />
              </>
            ) : (
              <ErrorCard code={response.error} message={response.message} />
            )}
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div
          className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-3 px-5 py-6 sm:flex-row sm:items-center sm:px-8"
        >
          <p className="folio">
            Tai Huynh · 2026 · built with Next.js 14 &amp; Gemini 2.5 Flash
          </p>
          <p className="folio" style={{ color: 'var(--ink-faint)' }}>
            <a href="https://github.com/0CCHacker" className="hover:text-accent" style={{ color: 'inherit' }}>
              Tai Huynh
            </a>
            <span className="mx-2" style={{ color: 'var(--rule)' }}>·</span>
            <a href="https://github.com/0CCHacker" className="hover:text-accent" style={{ color: 'inherit' }}>
              github
            </a>
            <span className="mx-2" style={{ color: 'var(--rule)' }}>·</span>
            <a
              href="mailto:huynhchitai.070306@gmail.com"
              className="hover:text-accent"
              style={{ color: 'inherit' }}
            >
              email
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

function LoadingSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-sm ${wide ? 'h-32' : 'h-24'}`}
      style={{ backgroundColor: 'var(--parchment-dark)' }}
      aria-hidden="true"
    />
  );
}

function ErrorCard({ code, message }: { code: string; message: string }) {
  return (
    <div
      className="rounded-sm border p-5"
      style={{
        borderColor: 'rgba(180, 40, 40, 0.25)',
        backgroundColor: 'rgba(180, 40, 40, 0.04)',
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span style={{ color: '#8b2020', fontSize: '1.25rem' }} aria-hidden>⚠</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#8b2020', fontFamily: 'var(--font-body)' }}>
            {code === 'RATE_LIMIT'
              ? 'Rate limit reached'
              : code === 'INVALID_INPUT'
              ? 'Invalid input'
              : 'Something went wrong'}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
