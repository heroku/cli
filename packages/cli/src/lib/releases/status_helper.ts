export const description = function (release: {status?: string, [k: string]: any}) {
  switch (release.status) {
  case 'pending':
    return 'release command executing'
  case 'failed':
    return 'release command failed'
  default:
    return ''
  }
}

export const color = function (s?: string) {
  switch (s) {
  case 'pending':
    return 'yellow'
  case 'failed':
    return 'red'
  default:
    return 'white'
  }
}
