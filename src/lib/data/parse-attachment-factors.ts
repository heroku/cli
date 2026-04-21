enum AttachmentFactorKeys {
  POOL = 'pool',
  PROXY = 'proxy',
  ROLE = 'role',
}

export type AttachmentFactors = {
  [AttachmentFactorKeys.POOL]?: string
  [AttachmentFactorKeys.PROXY]?: boolean
  [AttachmentFactorKeys.ROLE]?: string
}

/**
 * Parses a Heroku add-on attachment `namespace` string into structured factors.
 *
 * The namespace is a list of segments separated by `|`. Each segment must look
 * like `key:value`, using only the **first** `:` as the separator so values may
 * contain additional colons. Whitespace around keys and values is trimmed.
 *
 * Only keys listed in {@link AttachmentFactorKeys} are applied; unknown keys are
 * ignored. For `proxy`, the value is interpreted as a boolean (`true` only when
 * the trimmed string is exactly `"true"`). For `pool` and `role`, the value is
 * kept as a string. If the same key appears more than once, the last occurrence
 * wins.
 *
 * @param namespace - Raw attachment namespace, or nullish/blank for no factors
 * @returns A plain object with zero or more of `pool`, `proxy`, and `role` set
 */
export function parseAttachmentFactors(
  namespace?: null | string,
): AttachmentFactors {
  const result: AttachmentFactors = {}

  if (!namespace?.trim()) {
    return result
  }

  for (const factor of namespace.split('|')) {
    const parts = factor.match(/^([^:]+):(.*)$/) ?? []
    if (parts.length !== 3) {
      continue
    }

    const key = parts[1].trim()
    const value = (key === AttachmentFactorKeys.PROXY ? parts[2].trim() === 'true' : parts[2].trim())

    if ((Object.values(AttachmentFactorKeys) as readonly string[]).includes(key)) {
      Object.assign(result, {[key]: value} as AttachmentFactors)
    }
  }

  return result
}
