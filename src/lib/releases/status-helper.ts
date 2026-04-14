export const description = function (release: {[k: string]: any, status?: string}) {
  switch (release.status) {
    case 'expired': {
      return 'release expired'
    }

    case 'failed': {
      return 'release command failed'
    }

    case 'pending': {
      return 'release command executing'
    }

    default: {
      return ''
    }
  }
}

export const color = function (s?: string) {
  switch (s) {
    case 'expired': {
      return 'gray'
    }

    case 'failed': {
      return 'red'
    }

    case 'pending': {
      return 'yellow'
    }

    default: {
      return 'cyan'
    }
  }
}
