/**
 * Domain types for the meeting-notes summarizer.
 */

export interface ActionItem {
  task: string;
  owner: string;
  due: string;
}

export interface SummaryResult {
  tldr: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  followUpEmail: string;
}

export interface SummarizeRequest {
  transcript: string;  // 100–60000 chars
  context?: string;    // optional, ≤ 2000 chars
  redactPii?: boolean; // default false
}

// Typed API response shapes

export type SummarizeOk = {
  ok: true;
  data: SummaryResult;
  meta: {
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    transcriptChars: number;
    truncated: boolean;
    piiRedacted: boolean;
  };
};

export type SummarizeErrorCode =
  | 'INVALID_INPUT'
  | 'RATE_LIMIT'
  | 'AI_ERROR'
  | 'PARSE_ERROR'
  | 'INTERNAL';

export type SummarizeError = {
  ok: false;
  error: SummarizeErrorCode;
  message: string;
};

export type SummarizeResponse = SummarizeOk | SummarizeError;
