/**
 * Whether the arguments `open` passed to `child_process.spawn` include `url`.
 *
 * On macOS and Linux the URL is passed as-is. On Windows, `open` passes a
 * base64-encoded (UTF-16LE) PowerShell command instead, whose exact text
 * changes between `open` versions, so decode it rather than comparing bytes.
 */
export function spawnArgsInclude(args: readonly string[], url: string): boolean {
  return args.some(arg => arg.includes(url) || Buffer.from(arg, 'base64').toString('utf16le').includes(url))
}
