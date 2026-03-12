export const description = function (release: {[k: string]: any, status?: string}) {
  switch (release.status) {
  case 'pending': {
    return 'release command executing'
  }

  case 'failed': {
    return 'release command failed'
  }

  case 'expired': {
    return 'release expired'
  }

  default: {
    return ''
  }
  }
}

export const color = function (s?: string) {
  switch (s) {
  case 'pending': {
    return 'yellow'
  }

  case 'failed': {
    return 'red'
  }

  case 'expired': {
    return 'gray'
  }

  default: {
    return 'cyan'
  }
  }
}
