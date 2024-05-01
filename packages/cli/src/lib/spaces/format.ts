export function displayCIDR(cidr: string[] | undefined) {
  return cidr?.join(', ') ?? ''
}
