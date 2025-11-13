/**
 * Heroku-specific sensitive field patterns
 *
 * Consolidated list of field names and patterns that contain sensitive data in Heroku applications.
 *
 * Use this preset to ensure consistent PII handling across Heroku services.
 *
 * @example
 * ```typescript
 * import { HEROKU_FIELDS } from '@heroku/js-blanket/core/presets';
 * import { Scrubber } from '@heroku/js-blanket';
 *
 * const scrubber = new Scrubber({ fields: HEROKU_FIELDS });
 * const result = scrubber.scrub(data);
 * ```
 */
export const HEROKU_FIELDS = [
  // Authentication & Sessions
  'access_token',
  /api[-_]?key/i, // Matches api_key, api-key, apikey (case insensitive)
  'authenticity_token',
  'heroku_oauth_token',
  'heroku_session_nonce',
  'heroku_user_session',
  'oauth_token',
  'sudo_oauth_token',
  'super_user_session_secret',
  'user_session_secret',
  'postgres_session_nonce',

  // Passwords & Secrets
  'password',
  'passwd',
  'old_secret',
  'secret',
  'secret_token',
  'confirm_password',
  'password_confirmation',
  /client[-_]?secret/i, // Matches client_secret, client-secret, clientsecret

  // Tokens & Codes
  'token',
  'code',
  'state',
  'bouncer.token',
  'bouncer.refresh_token',

  // Headers (case-insensitive)
  /authorization/i,
  /cookie/i,
  /x-refresh-token/i,

  // SSO & Sessions
  'www-sso-session',

  // Payment
  'payment_method',

  // Infrastructure
  'logplexUrl',
];

/**
 * GDPR-relevant PII field patterns
 *
 * Field names that typically contain personally identifiable information (PII)
 * regulated by GDPR (General Data Protection Regulation).
 *
 * Use this preset when handling EU user data to ensure compliance with GDPR requirements.
 *
 * @see {@link https://gdpr.eu/what-is-gdpr/|GDPR Official Documentation}
 *
 * @example
 * ```typescript
 * import { GDPR_FIELDS, HEROKU_FIELDS } from '@heroku/js-blanket/core/presets';
 * import { Scrubber } from '@heroku/js-blanket';
 *
 * // Combine multiple presets
 * const scrubber = new Scrubber({
 *   fields: [...HEROKU_FIELDS, ...GDPR_FIELDS]
 * });
 * ```
 */
export const GDPR_FIELDS = [
  'email',
  'phone',
  'address',
  'postal_code',
  'ssn',
  'tax_id',
];

/**
 * PCI-DSS relevant field patterns
 *
 * Field names that typically contain payment card information regulated by
 * PCI-DSS (Payment Card Industry Data Security Standard).
 *
 * Use this preset when handling payment card data to help maintain PCI-DSS compliance.
 *
 * **Important**: This preset helps reduce exposure of sensitive payment data in logs and
 * error reports, but is not a substitute for full PCI-DSS compliance measures.
 *
 * @see {@link https://www.pcisecuritystandards.org/|PCI Security Standards Council}
 *
 * @example
 * ```typescript
 * import { PCI_FIELDS } from '@heroku/js-blanket/core/presets';
 * import { Scrubber } from '@heroku/js-blanket';
 *
 * const scrubber = new Scrubber({
 *   fields: PCI_FIELDS,
 *   patterns: [/\d{4}-\d{4}-\d{4}-\d{4}/g]  // Also scrub card numbers in text
 * });
 * ```
 */
export const PCI_FIELDS = [
  'card_number',
  'cvv',
  'credit_card',
  'payment_method',
];
