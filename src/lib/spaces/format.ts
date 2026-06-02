import * as color from '@heroku/heroku-cli-util/color'

export function displayCIDR(cidr: string[] | undefined) {
  return cidr?.join(', ') ?? ''
}

export function displayVPNStatus(s: string | undefined) {
  switch (s) {
    case 'available':
    case 'UP': {
      return `${color.success(s)}`
    }

    case 'deleted':
    case 'deleting':
    case 'DOWN': {
      return `${color.failure(s)}`
    }

    case 'deprovisioning':
    case 'pending':
    case 'provisioning': {
      return `${color.info(s)}`
    }

    default: {
      return s
    }
  }
}

export function hostStatus(s: string) {
  switch (s) {
    case 'available': {
      return `${color.success(s)}`
    }

    case 'permanent-failure':
    // falls through
    case 'released-permanent-failure': {
      return `${color.failure(s)}`
    }

    case 'released': {
      return `${color.gray(s)}`
    }

    case 'under-assessment': {
      return `${color.info(s)}`
    }

    default: {
      return s
    }
  }
}

export function peeringStatus(s: string) {
  switch (s) {
    case 'active': {
      return `${color.success(s)}`
    }

    case 'deleted':
    case 'expired':
    // falls through
    case 'failed':
    case 'rejected': {
      return `${color.failure(s)}`
    }

    case 'pending-acceptance':
    case 'provisioning': {
      return `${color.info(s)}`
    }

    default: {
      return s
    }
  }
}
