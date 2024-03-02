import {all} from './endpoints'
import {APIClient} from '@heroku-cli/command'

export default async function (flags: { endpoint: string | undefined; name: string | undefined; app: string }, heroku: APIClient) {
  if (flags.endpoint && flags.name) {
    throw new Error('Specified both --name and --endpoint, please use just one')
  }

  let endpoints = await all(flags.app, heroku)

  if (endpoints.length === 0) {
    throw new Error(`${flags.app} has no SSL certificates`)
  }

  if (flags.endpoint) {
    endpoints = endpoints.filter(function (endpoint) {
      return endpoint.cname === flags.endpoint
    })

    if (endpoints.length > 1) {
      throw new Error('Must pass --name when more than one endpoint matches --endpoint')
    }
  }

  if (flags.name) {
    endpoints = endpoints.filter(function (endpoint) {
      return endpoint.name === flags.name
    })

    if (endpoints.length > 1) {
      throw new Error(`More than one endpoint matches ${flags.name}, please file a support ticket`)
    }
  }

  if (endpoints.length > 1) {
    throw new Error('Must pass --name when more than one endpoint')
  }

  if (endpoints.length === 0) {
    throw new Error('Record not found.')
  }

  return endpoints[0]
}
