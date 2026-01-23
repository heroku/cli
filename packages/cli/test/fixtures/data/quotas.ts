import type {
  Quota,
  Quotas,
} from '../../../types/data.js'

export const quotasResponse: Quotas = {
  items: [
    {
      critical_gb: null,
      current_gb: 1.1,
      enforcement_action: 'none',
      enforcement_active: false,
      type: 'storage',
      warning_gb: null,
    },
    {
      critical_gb: 100,
      current_gb: 1.1,
      enforcement_action: 'notify',
      enforcement_active: true,
      type: 'otherQuota',
      warning_gb: 50,
    },
  ],
}

export const storageQuotaResponse: Quota = {
  critical_gb: 100,
  current_gb: null,
  enforcement_action: 'none',
  enforcement_active: false,
  type: 'storage',
  warning_gb: 50,
}

export const storageQuotaResponseRestricted: Quota = {
  critical_gb: 100,
  current_gb: 150,
  enforcement_action: 'restrict',
  enforcement_active: true,
  type: 'storage',
  warning_gb: 50,
}

export const storageQuotaResponseCriticalNotify: Quota = {
  critical_gb: 100,
  current_gb: 150,
  enforcement_action: 'notify',
  enforcement_active: false,
  type: 'storage',
  warning_gb: 50,
}

export const storageQuotaResponseWarning: Quota = {
  critical_gb: 100,
  current_gb: 75,
  enforcement_action: 'none',
  enforcement_active: false,
  type: 'storage',
  warning_gb: 50,
}
