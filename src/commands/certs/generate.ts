import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {spawn} from 'node:child_process'

import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {createSDK} from '../../lib/sdk.js'
import {SniEndpoint} from '../../lib/types/sni-endpoint.js'

/** The files the command wrote, as paths relative to the current directory. */
type GeneratedFiles = {certificate: string; domain: string; key: string} | {csr: string; domain: string; key: string}

function getCommand(certs: SniEndpoint[], domain: string): 'add' | 'update' {
  const shouldUpdate = certs
    .map(cert => cert?.ssl_cert?.cert_domains)
    .filter(certDomains => certDomains?.length)
    .flat()
    .includes(domain)

  return shouldUpdate ? 'update' : 'add'
}

export default class Generate extends Command {
  static args = {
    domain: Args.string({description: 'domain name to generate', required: true}),
  }
  static description = 'generate a key and a CSR or self-signed certificate'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    area: flags.string({description: 'sub-country area (state, province, etc.) of owner', optional: true}),
    city: flags.string({description: 'city of owner', optional: true}),
    country: flags.string({description: 'country of owner, as a two-letter ISO country code', optional: true}),
    keysize: flags.string({description: 'RSA key size in bits (default: 2048)', optional: true}),
    now: flags.boolean({description: 'do not prompt for any owner information', required: false}),
    owner: flags.string({description: 'name of organization certificate belongs to', optional: true}),
    remote: flags.remote(),
    selfsigned: flags.boolean({description: 'generate a self-signed certificate instead of a CSR', required: false}),
    subject: flags.string({description: 'specify entire certificate subject', optional: true}),
  }
  static help = 'Generate a key and certificate signing request (or self-signed certificate)\nfor an app. Prompts for information to put in the certificate unless --now\nis used, or at least one of the --subject, --owner, --country, --area, or\n--city options is specified.'
  static topic = 'certs'

  protected getSubject(args: any, flags: any) {
    const {domain} = args
    const {area, city, country, owner, subject} = flags
    if (subject) {
      return subject
    }

    let constructedSubject = ''
    if (country) {
      constructedSubject += `/C=${country}`
    }

    if (area) {
      constructedSubject += `/ST=${area}`
    }

    if (city) {
      constructedSubject += `/L=${city}`
    }

    if (owner) {
      constructedSubject += `/O=${owner}`
    }

    constructedSubject += `/CN=${domain}`

    return constructedSubject
  }

  async promptForOwnerInfo(inquirer: any) {
    return inquirer.prompt([
      {message: 'Owner of this certificate', name: 'owner', type: 'input'},
      {message: 'Country of owner (two-letter ISO code)', name: 'country', type: 'input'},
      {message: 'State/province/etc. of owner', name: 'area', type: 'input'},
      {message: 'City of owner', name: 'city', type: 'input'},
    ])
  }

  protected requiresPrompt(flags: any) {
    if (flags.subject) {
      return false
    }

    if (flags.now) {
      return false
    }

    const args = [flags.owner, flags.country, flags.area, flags.city]
    if (args.every((arg: string | undefined) => !arg)) {
      return true
    }

    return false
  }

  public async run(): Promise<GeneratedFiles> {
    const {platform} = createSDK(this.heroku)
    const inquirer = await lazyModuleLoader.loadInquirer()

    const {args, flags} = await this.parse(Generate)
    const {app, selfsigned} = flags
    if (this.requiresPrompt(flags)) {
      if (this.jsonEnabled()) {
        throw new Error('Pass --now, --subject, or at least one of --owner, --country, --area or --city. Commands don\'t prompt for owner information with --json.')
      }

      const {area, city, country, owner} = await this.promptForOwnerInfo(inquirer)
      Object.assign(flags, {
        area, city, country, owner,
      })
    }

    const subject = this.getSubject(args, flags)
    const {domain} = args
    const keysize = flags.keysize || 2048
    const keyfile = `${domain}.key`
    const certs = await platform.sniEndpoint.list(app)
    const command = getCommand(certs as SniEndpoint[], domain)
    if (selfsigned) {
      const crtfile = `${domain}.crt`
      await this.spawnOpenSSL(['req', '-new', '-newkey', `rsa:${keysize}`, '-nodes', '-keyout', keyfile, '-out', crtfile, '-subj', subject, '-x509'])
      console.error('Your key and self-signed certificate have been generated.')
      console.error('Next, run:')
      console.error(`$ heroku certs:${command} ${crtfile} ${keyfile}`)
      return {certificate: crtfile, domain, key: keyfile}
    }

    const csrfile = `${domain}.csr`
    await this.spawnOpenSSL(['req', '-new', '-newkey', `rsa:${keysize}`, '-nodes', '-keyout', keyfile, '-out', csrfile, '-subj', subject])
    console.error('Your key and certificate signing request have been generated.')
    console.error(`Submit the CSR in '${csrfile}' to your preferred certificate authority.`)
    console.error('When you\'ve received your certificate, run:')
    console.error(`$ heroku certs:${command} CERTFILE ${keyfile}`)
    return {csr: csrfile, domain, key: keyfile}
  }

  protected async spawnOpenSSL(args: ReadonlyArray<string>) {
    return new Promise((resolve, reject) => {
      // Under --json, openssl's stdout goes to our stderr (fd 2) so stdout holds only the JSON document.
      const child = spawn('openssl', args, {stdio: ['inherit', this.jsonEnabled() ? 2 : 'inherit', 'inherit']})
      child.once('error', reject)
      child.once('close', (code: number) => code ? reject(new Error(`Non zero openssl error ${code}`)) : resolve(code))
    })
  }
}
