import { describe, it, expect } from 'vitest';
import { redactPii, normalizeTranscript, prepareTranscript, MAX_TRANSCRIPT_CHARS } from '../transcript';

// ── redactPii ────────────────────────────────────────────────────────────────

describe('redactPii — email addresses', () => {
  it('masks a simple email address', () => {
    const result = redactPii('Contact alice@example.com for details.');
    expect(result).toBe('Contact [EMAIL REDACTED] for details.');
    expect(result).not.toContain('alice@example.com');
  });

  it('masks multiple email addresses in one string', () => {
    const result = redactPii('From: bob@acme.org To: carol@widgets.co.uk');
    expect(result).not.toContain('bob@acme.org');
    expect(result).not.toContain('carol@widgets.co.uk');
    expect(result.match(/\[EMAIL REDACTED\]/g)?.length).toBe(2);
  });

  it('masks email with plus sign and dots in local part', () => {
    const result = redactPii('Reply to: user.name+tag@sub.domain.io');
    expect(result).not.toContain('@');
    expect(result).toContain('[EMAIL REDACTED]');
  });

  it('leaves text without emails unchanged', () => {
    const text = 'The meeting was productive. No emails here.';
    expect(redactPii(text)).toBe(text);
  });

  it('leaves a plain domain name (no @) unchanged', () => {
    const text = 'Visit example.com for more info.';
    expect(redactPii(text)).toBe(text);
  });
});

describe('redactPii — phone numbers', () => {
  it('masks a standard US phone number with dashes', () => {
    const result = redactPii('Call me at 555-867-5309.');
    expect(result).not.toContain('555-867-5309');
    expect(result).toContain('[PHONE REDACTED]');
  });

  it('masks a US phone with parentheses and spaces', () => {
    const result = redactPii('Office: (212) 555-0100 ext TBD');
    expect(result).not.toContain('(212) 555-0100');
    expect(result).toContain('[PHONE REDACTED]');
  });

  it('masks an international phone number', () => {
    const result = redactPii('International: +44 20 7946 0958');
    expect(result).not.toContain('+44 20 7946 0958');
    expect(result).toContain('[PHONE REDACTED]');
  });

  it('masks a compact 10-digit US number', () => {
    const result = redactPii('Cell: 8005551234');
    expect(result).not.toContain('8005551234');
    expect(result).toContain('[PHONE REDACTED]');
  });

  it('does NOT mask a short version string like 3.4.1', () => {
    const text = 'Using library version 3.4.1 in production.';
    const result = redactPii(text);
    // short number — should NOT be redacted
    expect(result).toContain('3.4.1');
    expect(result).not.toContain('[PHONE REDACTED]');
  });

  it('leaves text with no phone numbers unchanged', () => {
    const text = 'Action item: review the pull request by Friday.';
    expect(redactPii(text)).toBe(text);
  });
});

describe('redactPii — combined', () => {
  it('masks both email and phone in the same string, leaves other text intact', () => {
    const input =
      'Contact sales at sales@company.com or call +1-800-555-0199. The project deadline is Q3.';
    const result = redactPii(input);

    expect(result).not.toContain('sales@company.com');
    expect(result).not.toContain('+1-800-555-0199');
    expect(result).toContain('[EMAIL REDACTED]');
    expect(result).toContain('[PHONE REDACTED]');
    // Non-PII text must survive
    expect(result).toContain('Contact sales at');
    expect(result).toContain('The project deadline is Q3.');
  });

  it('handles a realistic meeting transcript snippet', () => {
    const transcript = `
John Smith (john.smith@corp.com): Let's sync tomorrow.
I can be reached at (415) 867-5309 or +44 7911 123456.
Decision: proceed with the vendor contract.
    `.trim();

    const result = redactPii(transcript);
    expect(result).not.toContain('john.smith@corp.com');
    expect(result).not.toContain('(415) 867-5309');
    expect(result).not.toContain('+44 7911 123456');
    // Non-PII text must survive
    expect(result).toContain("Let's sync tomorrow.");
    expect(result).toContain('Decision: proceed with the vendor contract.');
  });
});

// ── normalizeTranscript ──────────────────────────────────────────────────────

describe('normalizeTranscript', () => {
  it('converts CRLF to LF', () => {
    expect(normalizeTranscript('line1\r\nline2')).toBe('line1\nline2');
  });

  it('collapses multiple blank lines to two', () => {
    const result = normalizeTranscript('a\n\n\n\nb');
    expect(result).toBe('a\n\nb');
  });

  it('collapses horizontal whitespace', () => {
    expect(normalizeTranscript('word1  \t  word2')).toBe('word1 word2');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeTranscript('  hello  ')).toBe('hello');
  });
});

// ── prepareTranscript ────────────────────────────────────────────────────────

describe('prepareTranscript', () => {
  it('returns truncated: false for short transcripts', () => {
    const { truncated } = prepareTranscript('a'.repeat(1000));
    expect(truncated).toBe(false);
  });

  it('truncates at MAX_TRANSCRIPT_CHARS and sets truncated: true', () => {
    const long = 'x'.repeat(MAX_TRANSCRIPT_CHARS + 500);
    const { text, truncated } = prepareTranscript(long);
    expect(truncated).toBe(true);
    // text should start with the first MAX_TRANSCRIPT_CHARS chars
    expect(text.startsWith('x'.repeat(MAX_TRANSCRIPT_CHARS))).toBe(true);
    // and include the truncation note
    expect(text).toContain('[NOTE: Transcript was truncated');
  });

  it('applies PII redaction when redactPii is true', () => {
    const { text } = prepareTranscript('Contact: test@example.com. ' + 'a'.repeat(200), {
      redactPii: true,
    });
    expect(text).not.toContain('test@example.com');
    expect(text).toContain('[EMAIL REDACTED]');
  });

  it('does NOT redact when redactPii is false (default)', () => {
    const { text } = prepareTranscript('Contact: test@example.com. ' + 'a'.repeat(200));
    expect(text).toContain('test@example.com');
  });
});
