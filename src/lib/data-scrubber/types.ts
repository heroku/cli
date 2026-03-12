/**
 * Configuration for the Scrubber
 *
 * Defines how the scrubber should identify and replace sensitive data.
 * Supports three complementary scrubbing strategies:
 *
 * 1. **Field-based scrubbing** (`fields`): Matches field names at any depth in the object tree
 * 2. **Path-based scrubbing** (`paths`): Matches specific dot-notation paths
 * 3. **Pattern-based scrubbing** (`patterns`): Matches regex patterns in string content
 *
 * All three strategies can be used together for comprehensive data scrubbing.
 *
 * @example Field-based configuration
 * ```typescript
 * const config: ScrubConfig = {
 *   fields: ['password', 'apiToken', /api[-_]?key/i], // Strings and regex patterns
 *   replacement: '[REDACTED]'
 * };
 * ```
 *
 * @example Path-based configuration
 * ```typescript
 * const config: ScrubConfig = {
 *   paths: [
 *     'user.email',
 *     'request.headers.authorization',
 *     'items[0].password'  // Array index notation
 *   ]
 * };
 * ```
 *
 * @example Pattern-based configuration
 * ```typescript
 * const config: ScrubConfig = {
 *   patterns: [
 *     /\b\d{3}-\d{2}-\d{4}\b/g,           // SSN
 *     /\d{4}-\d{4}-\d{4}-\d{4}/g,        // Credit card
 *     /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g  // Email
 *   ]
 * };
 * ```
 */
export interface ScrubConfig {
  /**
   * Field-based scrubbing: matches field names at any depth
   *
   * Supports both exact string matches and regular expressions for flexible matching.
   * String matches are case-insensitive and use substring matching.
   *
   * @example
   * ```typescript
   * fields: [
   *   'password',           // Matches 'password', 'Password', 'old_password', etc.
   *   'apiToken',           // Matches 'apiToken', 'api_token', etc.
   *   /api[-_]?key/i,       // Regex: matches 'api_key', 'api-key', 'apikey' (case insensitive)
   *   /^secret$/            // Exact match: only 'secret', not 'my_secret'
   * ]
   * ```
   */
  fields?: (string | RegExp)[];

  /**
   * Path-based scrubbing: matches specific dot-notation paths
   *
   * Use dot notation to target specific fields in nested objects.
   * Supports array index notation (e.g., `items[0].password`).
   *
   * @example
   * ```typescript
   * paths: [
   *   'user.email',                        // Scrubs obj.user.email
   *   'request.headers.authorization',     // Nested path
   *   'items[0].secret',                   // Array index notation
   *   'users[0]'                           // Scrubs entire array element
   * ]
   * ```
   */
  paths?: string[];

  /**
   * Pattern-based scrubbing: regex patterns for content scrubbing
   *
   * Scans string values and replaces content matching the patterns.
   * Use the global flag (`/pattern/g`) to replace all matches in a string.
   *
   * **Note**: Patterns are applied to string values only, not to field names or paths.
   *
   * @example
   * ```typescript
   * patterns: [
   *   /\b\d{3}-\d{2}-\d{4}\b/g,      // Social Security Number
   *   /\d{4}-\d{4}-\d{4}-\d{4}/g,    // Credit Card
   *   /Bearer\s+[A-Za-z0-9._-]+/g    // Bearer tokens
   * ]
   * ```
   */
  patterns?: RegExp[];

  /**
   * Replacement string for scrubbed values
   *
   * @default '[SCRUBBED]'
   *
   * @example
   * ```typescript
   * replacement: '[REDACTED]'     // Custom replacement text
   * replacement: '***'            // Simple masking
   * replacement: ''               // Empty string (removes content)
   * ```
   */
  replacement?: string;

  /**
   * Whether to recursively scrub nested objects
   *
   * When `true`, the scrubber traverses the entire object tree.
   * When `false`, only top-level fields are scrubbed.
   *
   * @default true
   *
   * @example
   * ```typescript
   * recursive: false  // Only scrub top-level fields
   * ```
   */
  recursive?: boolean;
}

/**
 * Result of a scrub operation
 *
 * Contains the scrubbed data along with metadata about what was scrubbed.
 *
 * @template T - The type of the scrubbed data (same as input type)
 *
 * @example
 * ```typescript
 * const scrubber = new Scrubber({ fields: ['password'] });
 * const result = scrubber.scrub({ user: 'john', password: 'secret' });
 *
 * console.log(result.data);           // { user: 'john', password: '[SCRUBBED]' }
 * console.log(result.scrubbed);       // true
 * console.log(result.scrubbedPaths);  // ['password']
 * ```
 */
export interface ScrubResult<T> {
  /**
   * The scrubbed data with sensitive values replaced
   *
   * This is a deep clone of the input with scrubbed values replaced.
   * The original input is never mutated.
   */
  data: T;

  /**
   * Whether any scrubbing occurred
   *
   * `true` if at least one value was scrubbed, `false` if no sensitive data was found.
   *
   * Useful for logging or metrics to track scrubbing activity.
   */
  scrubbed: boolean;

  /**
   * Array of paths that were scrubbed
   *
   * Contains dot-notation paths for all fields that were scrubbed.
   * Useful for debugging, auditing, or understanding what data was redacted.
   *
   * @example
   * ```typescript
   * ['password', 'user.email', 'request.headers.authorization']
   * ```
   */
  scrubbedPaths: string[];
}
