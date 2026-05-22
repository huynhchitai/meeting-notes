import { NextRequest, NextResponse } from 'next/server';
import { checkRate, getClientIp } from '@/lib/ratelimit';
import { summarizeInputSchema, summaryOutputSchema, GEMINI_RESPONSE_SCHEMA } from '@/lib/schema';
import { prepareTranscript } from '@/lib/transcript';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt';
import { getVertex, MODEL_ID } from '@/lib/vertex';
import type { SummarizeResponse, SummarizeErrorCode } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Maximum output tokens — caps cost and latency. */
const MAX_OUTPUT_TOKENS = 2_048;

export async function POST(req: NextRequest) {
  const started = Date.now();

  // ── 1. Rate limit ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rate = await checkRate(ip);
  if (!rate.ok) {
    return err(
      'RATE_LIMIT',
      `Rate limit exceeded (${rate.limit} summarizations/day). Please try again later.`,
      429,
    );
  }

  // ── 2. Parse + validate input ──────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_INPUT', 'Request body must be valid JSON.', 400);
  }

  const parsed = summarizeInputSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join('; ');
    return err('INVALID_INPUT', `Validation failed: ${msg}`, 400);
  }

  const { transcript, context, redactPii } = parsed.data;

  // ── 3. Prepare transcript (normalize, optional PII redaction, truncate) ─────
  const { text: preparedTranscript, truncated } = prepareTranscript(transcript, {
    redactPii: redactPii ?? false,
  });

  // ── 4. Build prompt ────────────────────────────────────────────────────────
  const userPrompt = buildUserPrompt({
    transcript: preparedTranscript,
    context,
  });

  // ── 5. Call Gemini with structured output ──────────────────────────────────
  let rawResult: unknown;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const vertex = getVertex();
    const model = vertex.preview.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: GEMINI_RESPONSE_SCHEMA as Record<string, unknown>,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0,
      },
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }],
      },
    });

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    const candidate = response.response.candidates?.[0];
    if (!candidate) {
      throw new Error('Gemini returned no candidates.');
    }

    // Token usage
    const usage = response.response.usageMetadata;
    inputTokens = usage?.promptTokenCount ?? 0;
    outputTokens = usage?.candidatesTokenCount ?? 0;

    const rawText = candidate.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini candidate had no text content.');
    }

    try {
      rawResult = JSON.parse(rawText);
    } catch {
      throw new Error('Gemini returned non-JSON content despite structured output mode.');
    }
  } catch (e) {
    // Never expose stack traces or internal error details to the client
    console.error('[summarize] Gemini error:', e);
    return err('AI_ERROR', 'The AI model failed to process the transcript. Please try again.', 502);
  }

  // ── 6. Validate LLM output ─────────────────────────────────────────────────
  const validated = summaryOutputSchema.safeParse(rawResult);
  if (!validated.success) {
    console.error('[summarize] Output validation failed:', validated.error.message, rawResult);
    return err('PARSE_ERROR', 'The AI returned an unexpected response format. Please try again.', 502);
  }

  // ── 7. Return ──────────────────────────────────────────────────────────────
  const response: SummarizeResponse = {
    ok: true,
    data: validated.data,
    meta: {
      durationMs: Date.now() - started,
      inputTokens,
      outputTokens,
      transcriptChars: transcript.length,
      truncated,
      piiRedacted: redactPii ?? false,
    },
  };

  return NextResponse.json(response);
}

function err(code: SummarizeErrorCode, message: string, status: number) {
  const body: SummarizeResponse = { ok: false, error: code, message };
  return NextResponse.json(body, { status });
}
