import {color} from '@heroku/heroku-cli-util'

export function displayCIDR(cidr: string[] | undefined) {
  return cidr?.join(', ') ?? ''
}

export function hostStatus(s: string) {
  switch (s) {
  case 'available': {
    return `${color.success(s)}`
  }

  case 'under-assessment': {
    return `${color.yellow(s)}`
  }

  case 'permanent-failure':
  case 'released-permanent-failure': {
    return `${color.failure(s)}`
  }

  case 'released': {
    return `${color.gray(s)}`
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

  case 'pending-acceptance':
  case 'provisioning': {
    return `${color.yellow(s)}`
  }

  case 'expired':
  case 'failed':
  case 'deleted':
  case 'rejected': {
    return `${color.failure(s)}`
  }

  default: {
    return s
  }
  }
}

export function displayVPNStatus(s: string | undefined) {
  switch (s) {
  case 'UP':
  case 'available': {
    return `${color.success(s)}`
  }

  case 'pending':
  case 'provisioning':
  case 'deprovisioning': {
    return `${color.yellow(s)}`
  }

  case 'DOWN':
  case 'deleting':
  case 'deleted': {
    return `${color.failure(s)}`
  }

  default: {
    return s
  }
  }
}
