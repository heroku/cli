import color from '@heroku-cli/color'
import {Command, Flags, ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {capitalize} from '@oclif/core/lib/util'
import {formatDistanceToNow} from 'date-fns'
import HTTP from '@heroku/http-call'
import {
  TrustInstance,
  TrustIncident,
  TrustMaintenance,
  HerokuStatus,
  FormattedTrustStatus, SystemStatus,
} from '../lib/types/status'


const errorMessage = 'Heroku platform status is unavailable at this time. Refer to https://status.salesforce.com/products/Heroku or try again later.'

const printStatus = (status: string) => {
  const colorize = (color as any)[status]
  let message = capitalize(status)

  if (status === 'green') {
    message = 'No known issues at this time.'
  }

  return colorize(message)
}

const getTrustStatus = async () => {
  const trustInstancesPath = '/instances'
  const trustActiveIncidentsPath = '/incidents/active'
  const trustMaintenancesPath = '/maintenances'
  const trustHost = process.env.HEROKU_TRUST_STAGING ? 'https://status-api-stg.test.edgekey.net/v1' : 'https://api.status.salesforce.com/v1'
  let instances: TrustInstance[] = []
  let activeIncidents: TrustIncident[] = []
  let maintenances: TrustMaintenance[] = []

  try {
    const instanceResponse = await HTTP.get<TrustInstance[]>(`${trustHost}${trustInstancesPath}?products=Heroku`)
    const activeIncidentsResponse = await HTTP.get<TrustIncident[]>(`${trustHost}${trustActiveIncidentsPath}`)
    const maintenancesResponse = await HTTP.get<TrustMaintenance[]>(`${trustHost}${trustMaintenancesPath}?limit=10&offset=0&product=Heroku&locale=en`)
    instances = instanceResponse.body
    activeIncidents = activeIncidentsResponse.body
    maintenances = maintenancesResponse.body
  } catch {
    ux.error(errorMessage, {exit: 1})
  }

  return formatTrustResponse(instances, activeIncidents, maintenances)
}

const determineIncidentSeverity = (incidents: TrustIncident[]) => {
  const severityArray: string[] = []
  incidents.forEach(incident => {
    incident.IncidentImpacts.forEach(impact => {
      if (!impact.endTime && impact.severity) {
        severityArray.push(impact.severity)
      }
    })
  })
  if (severityArray.includes('major')) return 'red'
  if (severityArray.includes('minor')) return 'yellow'
  return 'green'
}

const formatTrustResponse = (instances: TrustInstance[], activeIncidents: TrustIncident[], maintenances: TrustMaintenance[]): FormattedTrustStatus => {
  const systemStatus: SystemStatus[] = []
  const incidents: TrustIncident[] = []
  const scheduled: TrustMaintenance[] = []
  const instanceKeyArray = new Set(instances.map(instance => instance.key))
  const herokuActiveIncidents = activeIncidents.filter(incident => {
    return incident.instanceKeys.some(key => instanceKeyArray.has(key))
  })
  const toolsIncidents = herokuActiveIncidents.filter(incident => {
    return incident.instanceKeys.includes('TOOLS')
  })
  const appsIncidents = herokuActiveIncidents.filter(incident => {
    return incident.serviceKeys.includes('HerokuApps')
  })
  const dataIncidents = herokuActiveIncidents.filter(incident => {
    return incident.serviceKeys.includes('HerokuData')
  })

  if (toolsIncidents.length > 0) {
    const severity = determineIncidentSeverity(toolsIncidents)
    systemStatus.push({system: 'Tools', status: severity})
    incidents.push(...toolsIncidents)
  } else {
    systemStatus.push({system: 'Tools', status: 'green'})
  }

  if (appsIncidents.length > 0) {
    const severity = determineIncidentSeverity(appsIncidents)
    systemStatus.push({system: 'Apps', status: severity})
    incidents.push(...appsIncidents)
  } else {
    systemStatus.push({system: 'Apps', status: 'green'})
  }

  if (dataIncidents.length > 0) {
    const severity = determineIncidentSeverity(appsIncidents)
    systemStatus.push({system: 'Data', status: severity})
    incidents.push(...dataIncidents)
  } else {
    systemStatus.push({system: 'Data', status: 'green'})
  }

  if (maintenances.length > 0) scheduled.push(...maintenances)

  return {
    status: systemStatus,
    incidents,
    scheduled,
  }
}

const getIncidentDetails = (herokuStatus: HerokuStatus | undefined, formattedTrustStatus: FormattedTrustStatus | undefined) => {
  if (herokuStatus) {
    const {incidents} = herokuStatus
    if (incidents.length === 0) return []
    return incidents
  } else if (formattedTrustStatus) {
    const {incidents} = formattedTrustStatus
    if (incidents.length === 0) return []

    return incidents.map(incident => {
      const incidentInfo = {
        title: incident.id,
        created_at: incident.createdAt,
        full_url: `https://status.salesforce.com/incidents/${incident.id}`,
      }
      const incidentUpdates = incident.IncidentEvents.map(event => {
        return {
          update_type: event.type,
          updated_at: event.updatedAt,
          contents: event.message,
        }
      })
      return {
        ...incidentInfo,
        updates: incidentUpdates,
      }
    })
  }

  return []
}

export default class Status extends Command {
  static description = 'display current status of the Heroku platform'

  static flags = {
    json: Flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Status)
    const herokuApiPath = '/api/v4/current-status'
    let herokuStatus
    let formattedTrustStatus

    if (process.env.TRUST_ONLY) {
      formattedTrustStatus = await getTrustStatus()
    } else {
      try {
        // Try calling the Heroku status API first
        const herokuHost = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com'
        const herokuStatusResponse = await HTTP.get<HerokuStatus>(herokuHost + herokuApiPath)
        herokuStatus = herokuStatusResponse.body
      } catch {
        formattedTrustStatus = await getTrustStatus()
      }
    }

    if (!herokuStatus && !formattedTrustStatus) ux.error(errorMessage, {exit: 1})

    if (flags.json) {
      hux.styledJSON(herokuStatus ?? formattedTrustStatus)
      return
    }

    const systemStatus = herokuStatus ? herokuStatus.status : formattedTrustStatus?.status

    if (systemStatus) {
      for (const item of systemStatus) {
        const message = printStatus(item.status)

        this.log(`${(item.system + ':').padEnd(11)}${message}`)
      }
    } else {
      ux.error(errorMessage, {exit: 1})
    }

    const incidentDetails = getIncidentDetails(herokuStatus, formattedTrustStatus)

    for (const incident of incidentDetails) {
      ux.log()
      hux.styledHeader(`${incident.title} ${color.yellow(incident.created_at)} ${color.cyan(incident.full_url)}`)

      const padding = maxBy(incident.updates, (i: any) => i.update_type.length).update_type.length + 0
      for (const u of incident.updates) {
        ux.log(`${color.yellow(u.update_type.padEnd(padding))} ${new Date(u.updated_at).toISOString()} (${formatDistanceToNow(new Date(u.updated_at))} ago)`)
        ux.log(`${u.contents}\n`)
      }
    }
  }
}
