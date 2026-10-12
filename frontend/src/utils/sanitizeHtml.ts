import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes user-authored rich text before it is rendered as HTML.
 * The backend already sanitizes on write; this guards against legacy rows
 * and any future path that skips the API validators.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
