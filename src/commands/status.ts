import {color, hux} from '@heroku/heroku-cli-util'
import {HTTP} from '@heroku/http-call'
import {Command, Flags, ux} from '@oclif/core'
import {formatDistanceToNow} from 'date-fns'

import {getMaxUpdateTypeLength} from '../lib/status/util.js'
import {
  FormattedTrustStatus,
  HerokuStatus,
  Localization,
  SystemStatus,
  TrustIncident,
  TrustInstance,
  TrustMaintenance,
} from '../lib/types/status.js'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
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
  const trustHost = process.env.SF_TRUST_STAGING ? 'https://status-api-stg.test.edgekey.net/v1' : 'https://api.status.salesforce.com/v1'
  const currentDateTime = new Date(Date.now()).toISOString()
  let instances: TrustInstance[] = []
  let activeIncidents: TrustIncident[] = []
  let maintenances: TrustMaintenance[] = []
  let localizations: Localization[] = []

  try {
    const [instanceResponse, activeIncidentsResponse, maintenancesResponse, localizationsResponse] = await Promise.all([
      HTTP.get<TrustInstance[]>(`${trustHost}/instances?products=Heroku`),
      HTTP.get<TrustIncident[]>(`${trustHost}/incidents/active`),
      HTTP.get<TrustMaintenance[]>(`${trustHost}/maintenances?startTime=${currentDateTime}&limit=10&offset=0&product=Heroku&locale=en`),
      HTTP.get<Localization[]>(`${trustHost}/localizations?locale=en`),
    ])
    instances = instanceResponse.body
    activeIncidents = activeIncidentsResponse.body
    maintenances = maintenancesResponse.body
    localizations = localizationsResponse.body
  } catch {
    ux.error(errorMessage, {exit: 1})
  }

  return formatTrustResponse(instances, activeIncidents, maintenances, localizations)
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

const formatTrustResponse = (instances: TrustInstance[], activeIncidents: TrustIncident[], maintenances: TrustMaintenance[], localizations: Localization[]): FormattedTrustStatus => {
  const systemStatus: SystemStatus[] = []
  const incidents: TrustIncident[] = []
  const scheduled: TrustMaintenance[] = []
  const instanceKeyArray = new Set(instances.map(instance => instance.key))
  const herokuActiveIncidents = activeIncidents.filter(incident => incident.instanceKeys.some(key => instanceKeyArray.has(key)))
  const toolsIncidents = herokuActiveIncidents.filter(incident => {
    const tools = ['TOOLS', 'Tools', 'CLI', 'Dashboard', 'Platform API']
    return tools.some(tool => incident.serviceKeys.includes(tool))
  })
  const appsIncidents = herokuActiveIncidents.filter(incident => incident.serviceKeys.includes('HerokuApps') || incident.serviceKeys.includes('Apps'))
  const dataIncidents = herokuActiveIncidents.filter(incident => incident.serviceKeys.includes('HerokuData') || incident.serviceKeys.includes('Data'))

  if (appsIncidents.length > 0) {
    const severity = determineIncidentSeverity(appsIncidents)
    systemStatus.push({status: severity, system: 'Apps'})
    incidents.push(...appsIncidents)
  } else {
    systemStatus.push({status: 'green', system: 'Apps'})
  }

  if (dataIncidents.length > 0) {
    const severity = determineIncidentSeverity(dataIncidents)
    systemStatus.push({status: severity, system: 'Data'})
    incidents.push(...dataIncidents)
  } else {
    systemStatus.push({status: 'green', system: 'Data'})
  }

  if (toolsIncidents.length > 0) {
    const severity = determineIncidentSeverity(toolsIncidents)
    systemStatus.push({status: severity, system: 'Tools'})
    incidents.push(...toolsIncidents)
  } else {
    systemStatus.push({status: 'green', system: 'Tools'})
  }

  if (maintenances.length > 0) scheduled.push(...maintenances)

  if (incidents.length > 0) {
    incidents.forEach(incident => {
      incident.IncidentEvents.forEach(event => {
        event.localizedType = localizations.find((l: any) => l.modelKey === event.type)?.text
      })
    })
  }

  /* eslint-disable perfectionist/sort-objects */
  return {
    status: systemStatus,
    incidents,
    scheduled,
  }
  /* eslint-enable perfectionist/sort-objects */
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
        // If the Heroku status API call fails, call the SF Trust API
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

    if (herokuStatus) {
      for (const incident of herokuStatus.incidents) {
        ux.stdout()
        hux.styledHeader(`${incident.title} ${color.warning(incident.created_at)} ${color.info(incident.full_url)}`)

        const padding = getMaxUpdateTypeLength(incident.updates.map(update => update.update_type))
        for (const u of incident.updates) {
          ux.stdout(`${color.warning(u.update_type.padEnd(padding))} ${new Date(u.updated_at).toISOString()} (${formatDistanceToNow(new Date(u.updated_at))} ago)`)
          ux.stdout(`${u.contents}\n`)
        }
      }
    } else if (formattedTrustStatus) {
      for (const incident of formattedTrustStatus.incidents) {
        ux.stdout()
        hux.styledHeader(`${incident.id} ${color.warning(incident.createdAt)} ${color.info(`https://status.salesforce.com/incidents/${incident.id}`)}`)

        const padding = getMaxUpdateTypeLength(incident.IncidentEvents.map(event => event.localizedType ?? event.type))
        for (const event of incident.IncidentEvents) {
          const eventType = event.localizedType ?? event.type
          ux.stdout(`${color.warning(eventType.padEnd(padding))} ${new Date(event.createdAt).toISOString()} (${formatDistanceToNow(new Date(event.createdAt))} ago)`)
          ux.stdout(`${event.message}\n`)
        }
      }
    }
  }
}
