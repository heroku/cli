export function CIDR(cidr: string[] | undefined) {
  if (!cidr || cidr.length === 0) return ''
  return cidr.join(', ')
}
