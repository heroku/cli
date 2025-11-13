/**
 * Regex patterns for detecting PII in string content
 */
export const PII_PATTERNS = [
  // Social Security Numbers (US)
  /\b\d{3}-\d{2}-\d{4}\b/g,

  // Credit Cards (basic - matches common formats)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (US format)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,

  // JWT tokens
  /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,

  // API keys (generic 32+ char alphanumeric strings)
  /\b[A-Za-z0-9]{32,}\b/g,
]
