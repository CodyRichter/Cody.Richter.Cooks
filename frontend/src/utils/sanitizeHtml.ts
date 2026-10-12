import { FilterXSS } from "xss";

const ALIGNABLE = ["style"];

// Mirrors the backend allowlist (backend/app/utils/html_validator.py).
const filter = new FilterXSS({
  whiteList: {
    p: ALIGNABLE,
    h1: ALIGNABLE,
    h2: ALIGNABLE,
    h3: ALIGNABLE,
    h4: ALIGNABLE,
    h5: ALIGNABLE,
    h6: ALIGNABLE,
    br: [],
    hr: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    mark: [],
    sub: [],
    sup: [],
    code: [],
    pre: [],
    ul: [],
    ol: ["start"],
    li: [],
    blockquote: [],
    span: [],
    div: [],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
  },
  css: { whiteList: { "text-align": true } },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});

/**
 * Sanitizes user-authored rich text before it is rendered as HTML.
 * The backend already sanitizes on write; this guards against legacy rows
 * and any future path that skips the API validators. Works identically on
 * the server (SSR) and in the browser.
 */
export function sanitizeHtml(html: string): string {
  return filter.process(html);
}
