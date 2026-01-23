import {hux} from '@heroku/heroku-cli-util'

import type {Quota} from '../../../types/data.js'

/**
 * @description Returns a string describing the current quota compliance status.
 *
 * The compliance status is determined by evaluating the current usage against the warning and critical quotas.
 * If no quotas are set, the function returns "(No quotas set)".
 * If the current usage exceeds the critical quota and enforcement is active, the function returns "(Restricted)".
 * If the current usage exceeds the critical quota, the function returns "(Exceeded configured critical quota)".
 * If the current usage exceeds the warning quota, the function returns "(Exceeded configured warning quota)".
 * Otherwise, the function returns "(Within configured quotas)".
 *
 * @param {Quota} quota - The quota object to evaluate.
 * @returns {string} - A string describing the current quota compliance status.
 */
function getComplianceMessage(quota: Quota): string {
  const currentUsage = quota.current_gb ?? 0
  if (!quota.critical_gb && !quota.warning_gb) return '(No quotas set)'
  if (quota.critical_gb && currentUsage > quota.critical_gb && quota.enforcement_active) return '(Restricted)'
  if (quota.critical_gb && currentUsage > quota.critical_gb) return '(Exceeded configured critical quota)'
  if (quota.warning_gb && currentUsage > quota.warning_gb) return '(Exceeded configured warning quota)'
  return '(Within configured quotas)'
}

/**
 * @description Formats a quota object into a human-readable status string.
 *
 * The status string includes the current usage of the quota, the critical quota limit, and the compliance message.
 *
 * @param {Quota} quota - The quota object to format.
 *
 * @returns {string} The formatted status string.
 */
export const formatQuotaStatus = (quota: Quota): string => {
  const complianceMessage = getComplianceMessage(quota)
  const currentUsage = quota.current_gb ?? 0
  const usagePercentOfCriticalQuota = quota.critical_gb ? (currentUsage / quota.critical_gb) * 100 : null
  const usageMessage = `${hux.toHumanReadableDataSize(currentUsage)}${quota.critical_gb ? ` / ${hux.toHumanReadableDataSize(quota.critical_gb)}` : ''}${usagePercentOfCriticalQuota ? ` (${usagePercentOfCriticalQuota.toFixed(2)}%)` : ''}`
  return `${usageMessage} ${complianceMessage}`
}

/**
 * @description Displays a quota object in a human-readable format.
 *
 * @param {Quota} quota - The quota object to display.
 *
 * @returns {void}
 */
export const displayQuota = (quota: Quota): void => {
  hux.styledHeader(hux.toTitleCase(quota.type) || '')
  hux.styledObject({
    Warning: quota.warning_gb ? hux.toHumanReadableDataSize(quota.warning_gb) : 'Not set',
    // eslint-disable-next-line perfectionist/sort-objects
    Critical: quota.critical_gb ? hux.toHumanReadableDataSize(quota.critical_gb) : 'Not set',
    'Enforcement Action': hux.toTitleCase(quota.enforcement_action),
    Status: formatQuotaStatus(quota),
  }, ['Warning', 'Critical', 'Enforcement Action', 'Status'], // this order isn't being respected by the new implementation
  )
}
