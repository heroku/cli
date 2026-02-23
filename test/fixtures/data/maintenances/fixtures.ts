import {Maintenance, MaintenanceStatus} from '../../../../src/lib/data/types.js'
import {addon} from '../pg/fixtures.js'

export const maintenance: Maintenance = {
  addon: {
    attachments: ['DATABASE_URL'],
    kind: 'heroku-postgresql',
    name: addon.name,
    plan: addon.plan?.name || 'heroku-postgresql:standard-0',
    window: 'Thursdays 22:00 to Fridays 02:00 UTC',
  },
  app: {
    name: 'my-cedar-app',
  },
  completed_at: null,
  duration_seconds: null,
  method: 'changeover',
  previously_scheduled_for: '2019-11-05 22:00:00 +0000',
  reason: 'routine_maintenance',
  required_by: '2019-11-12 17:57:01 +0000',
  scheduled_for: '2019-11-07 22:00:00 +0000',
  server_created_at: '2019-10-24 23:24:47 +0000',
  started_at: null,
  status: MaintenanceStatus.none,
  window: 'Thursdays 22:00 to Fridays 02:00 UTC',
}

export const maintenancesRunResponse = {
  previously_scheduled_for: maintenance.previously_scheduled_for,
  required_by: maintenance.required_by,
  scheduled_for: maintenance.scheduled_for,
  window: maintenance.window,
}
