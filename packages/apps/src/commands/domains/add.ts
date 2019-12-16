import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'
import {prompt} from 'inquirer'
import * as shellescape from 'shell-escape'

import waitForDomain from '../../lib/wait-for-domain'

interface DomainCreatePayload {
  hostname: string;
  sni_endpoint?: string;
}

const MULTIPLE_SNI_ENDPOINT_FLAG = 'allow-multiple-sni-endpoints'

export default class DomainsAdd extends Command {
  static description = 'add a domain to an app'

  static examples = ['heroku domains:add www.example.com']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    cert: flags.string({description: 'the name of the SSL cert you want to use for this domain', char: 'c'}),
    json: flags.boolean({description: 'output in json format', char: 'j'}),
    wait: flags.boolean(),
    remote: flags.remote(),
  }

  static args = [{name: 'hostname'}]

  createDomain = async (appName: string, payload: DomainCreatePayload): Promise<Heroku.Domain> => {
    cli.action.start(`Adding ${color.green(payload.hostname)} to ${color.app(appName)}`)
    try {
      const response = await this.heroku.post<Heroku.Domain>(`/apps/${appName}/domains`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.allow_multiple_sni_endpoints'},
        body: payload,
      })
      return response.body
    } catch (error) {
      // If the error indicates that the app has multiple certs needs the user to specify which one
      // to use, we ask them which cert to use, otherwise we rethrow the error and handle it like usual
      if (error.body.id === 'invalid_params' && error.body.message.includes('sni_endpoint')) {
        cli.action.stop('resolving SNI endpoint')
        const {body: certs} = await this.heroku.get<Heroku.SniEndpoint>(`/apps/${appName}/sni-endpoints`, {
          headers: {Accept: 'application/vnd.heroku+json; version=3.allow_multiple_sni_endpoints'},
        })

        const certChoices = certs.map((cert: Heroku.SniEndpoint) => {
          const certName = cert.displayName || cert.name
          const domainsLength = cert.ssl_cert.cert_domains.length

          if (domainsLength) {
            let domainsList = cert.ssl_cert.cert_domains.slice(0, 4).join(', ')

            if (domainsLength > 5) {
              domainsList = `${domainsList} (...and ${domainsLength - 4} more)`
            }

            domainsList = `${certName} -> ${domainsList}`

            return {
              name: domainsList,
              value: cert.name,
            }
          }

          return {
            name: certName,
            value: cert.name,
          }
        })

        const selection = await prompt<{ cert: string }>([
          {
            type: 'list',
            name: 'cert',
            message: 'Choose an SNI endpoint to associate with this domain',
            choices: certChoices,
          },
        ])

        // eslint-disable-next-line require-atomic-updates
        payload.sni_endpoint = selection.cert

        return this.createDomain(appName, payload)
      }
      throw error
    }
  }

  async run() {
    const {args, flags} = this.parse(DomainsAdd)
    const {hostname} = args

    const {body: featureList} = await this.heroku.get<Array<Heroku.AppFeature>>(`/apps/${flags.app}/features`)

    const multipleSniEndpointFeature = featureList.find(feature => feature.name === MULTIPLE_SNI_ENDPOINT_FLAG)

    const domainCreatePayload: DomainCreatePayload = {
      hostname,
    }

    if (multipleSniEndpointFeature && multipleSniEndpointFeature.enabled) {
      // multiple SNI endpoints is enabled
      if (flags.cert) {
        domainCreatePayload.sni_endpoint = flags.cert
      }
    }

    try {
      const domain = await this.createDomain(flags.app, domainCreatePayload)
      if (flags.json) {
        cli.styledJSON(domain)
      } else {
        cli.log(`Configure your app's DNS provider to point to the DNS Target ${color.green(domain.cname || '')}.
  For help, see https://devcenter.heroku.com/articles/custom-domains`)
        if (domain.status !== 'none') {
          if (flags.wait) {
            await waitForDomain(flags.app, this.heroku, domain)
          } else {
            cli.log('')
            cli.log(`The domain ${color.green(hostname)} has been enqueued for addition`)
            const command = `heroku domains:wait ${shellescape([hostname])}`
            cli.log(`Run ${color.cmd(command)} to wait for completion`)
          }
        }
      }
    } catch (error) {
      cli.error(error)
    } finally {
      cli.action.stop()
    }
  }
}
