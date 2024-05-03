import color from '@heroku-cli/color'

export function displayCIDR(cidr: string[] | undefined) {
  return cidr?.join(', ') ?? ''
}

export function hostStatus(s: string) {
  switch (s) {
  case 'available':
    return `${color.green(s)}`
  case 'under-assessment':
    return `${color.yellow(s)}`
  case 'permanent-failure':
  case 'released-permanent-failure':
    return `${color.red(s)}`
  case 'released':
    return `${color.gray(s)}`
  default:
    return s
  }
}
