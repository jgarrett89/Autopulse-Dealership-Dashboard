import { Assumptions, MarkdownTier, PipelineStage } from '../../src/types/dealership.js';

const VALID_PIPELINE_STAGES: PipelineStage[] = [
  'New',
  'Contacted',
  'Test Drive',
  'Negotiation',
  'Won',
  'Lost',
];

/**
 * Strips HTML tags, null bytes, and non-printable control characters,
 * normalizes whitespace, and truncates to maxLength.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // strip null bytes
    .replace(/<[^>]*>?/gm, '') // strip HTML/script tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // non-printable control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes and validates a natural language AI query.
 */
export function sanitizeAiQuestion(question: unknown): string {
  const sanitized = sanitizeString(question, 300);
  // Strip potentially abusive prompt injection tokens or excessive repetitions
  return sanitized.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ');
}

/**
 * Validates and sanitizes a Google Spreadsheet ID.
 * Standard IDs consist of 20-100 alphanumeric chars, hyphens, and underscores.
 */
export function sanitizeSpreadsheetId(id: unknown): string | null {
  if (!id || typeof id !== 'string') return null;
  const cleaned = id.trim();
  // Ensure valid characters only (no path traversal, url params, or special chars)
  const isValid = /^[a-zA-Z0-9_-]{20,100}$/.test(cleaned);
  return isValid ? cleaned : null;
}

/**
 * Validates and sanitizes the Assumptions payload (Close rates & Markdown ladder)
 */
export function sanitizeAssumptionsPayload(payload: unknown, currentFallback: Assumptions): Assumptions {
  if (!payload || typeof payload !== 'object') {
    return currentFallback;
  }

  const raw = payload as any;
  const sanitizedCloseRates: Record<PipelineStage, number> = {
    ...currentFallback.closeRates,
  };

  if (raw.closeRates && typeof raw.closeRates === 'object') {
    for (const stage of VALID_PIPELINE_STAGES) {
      if (typeof raw.closeRates[stage] === 'number' && !isNaN(raw.closeRates[stage])) {
        // Clamp probabilities strictly between 0 and 1
        const clamped = Math.max(0, Math.min(1, raw.closeRates[stage]));
        sanitizedCloseRates[stage] = Number(clamped.toFixed(4));
      }
    }
  }

  // Force Won to 1.0 and Lost to 0.0 for logical mathematical consistency
  sanitizedCloseRates['Won'] = 1.0;
  sanitizedCloseRates['Lost'] = 0.0;

  let sanitizedMarkdownLadder: MarkdownTier[] = [...currentFallback.markdownLadder];

  if (Array.isArray(raw.markdownLadder) && raw.markdownLadder.length > 0) {
    const validTiers: MarkdownTier[] = [];
    for (const tier of raw.markdownLadder) {
      if (tier && typeof tier === 'object') {
        const minDays = Number(tier.min_days_on_lot);
        const markdownPct = Number(tier.markdown_pct);

        if (!isNaN(minDays) && !isNaN(markdownPct)) {
          validTiers.push({
            min_days_on_lot: Math.max(0, Math.min(365, Math.round(minDays))),
            markdown_pct: Math.max(0, Math.min(0.9, Number(markdownPct.toFixed(4)))),
          });
        }
      }
    }

    if (validTiers.length > 0) {
      // Sort by min_days_on_lot ascending and limit to 10 tiers
      sanitizedMarkdownLadder = validTiers
        .sort((a, b) => a.min_days_on_lot - b.min_days_on_lot)
        .slice(0, 10);
    }
  }

  return {
    closeRates: sanitizedCloseRates,
    markdownLadder: sanitizedMarkdownLadder,
  };
}

/**
 * Strips sensitive environment variables, internal server paths,
 * and API keys from error messages before sending to client.
 */
export function sanitizeErrorMessage(err: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (!err) return defaultMessage;
  const rawMsg = err instanceof Error ? err.message : String(err);

  // Mask any potential API key or token sequences (e.g. AIza..., Bearer..., sk-...)
  return rawMsg
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/(?:private_key|apiKey|secret|password|credential)[\s:=]+[^\s,;}]+/gi, '$1=[REDACTED]')
    .replace(/\/[\w/.-]+\/(server|src|dist)\b/g, '[INTERNAL_PATH]')
    .slice(0, 200);
}
