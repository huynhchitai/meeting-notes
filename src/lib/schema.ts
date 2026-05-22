import { z } from 'zod';

// ── Input validation ────────────────────────────────────────────────────────

export const summarizeInputSchema = z.object({
  transcript: z
    .string()
    .min(100, 'Transcript must be at least 100 characters.')
    .max(60_000, 'Transcript must be at most 60,000 characters.'),
  context: z
    .string()
    .max(2_000, 'Context must be at most 2,000 characters.')
    .optional(),
  redactPii: z.boolean().optional().default(false),
});

export type SummarizeInput = z.infer<typeof summarizeInputSchema>;

// ── Output validation ───────────────────────────────────────────────────────

const actionItemSchema = z.object({
  task: z.string().min(1),
  owner: z.string().min(1),
  due: z.string().min(1),
});

export const summaryOutputSchema = z.object({
  tldr: z.string().min(1).max(1_000),
  keyPoints: z.array(z.string().min(1)).min(1).max(20),
  decisions: z.array(z.string().min(1)).max(20),
  actionItems: z.array(actionItemSchema).max(30),
  followUpEmail: z.string().min(1).max(4_000),
});

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;

// ── Gemini responseSchema (OpenAPI subset) ─────────────────────────────────
// Gemini structured output uses a strict subset: no $ref, no anyOf,
// nullable must be { nullable: true } not { type: ['string', 'null'] }.

export const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    tldr: {
      type: 'string',
      description: 'A concise 1-3 sentence summary of the entire meeting.',
    },
    keyPoints: {
      type: 'array',
      description: 'The 3-10 most important discussion points raised.',
      items: { type: 'string' },
    },
    decisions: {
      type: 'array',
      description: 'Explicit decisions that were reached or agreed upon.',
      items: { type: 'string' },
    },
    actionItems: {
      type: 'array',
      description: 'Concrete tasks assigned to specific people.',
      items: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'Description of the task.',
          },
          owner: {
            type: 'string',
            description: 'Person responsible. Use "TBD" if unclear.',
          },
          due: {
            type: 'string',
            description: 'Due date or timeframe. Use "TBD" if not stated.',
          },
        },
        required: ['task', 'owner', 'due'],
      },
    },
    followUpEmail: {
      type: 'string',
      description:
        'A professional follow-up email ready to send. Include subject line as first line prefixed with "Subject: ".',
    },
  },
  required: ['tldr', 'keyPoints', 'decisions', 'actionItems', 'followUpEmail'],
} as const;
