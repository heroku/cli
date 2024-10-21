import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {spawn} from 'node:child_process'
import * as inquirer from 'inquirer'
import {SniEndpoint} from '../../lib/types/sni_endpoint'

function getCommand(certs: SniEndpoint[], domain: string): 'update' | 'add' {
  const shouldUpdate = certs
    .map(cert => cert?.ssl_cert?.cert_domains)
    .filter(certDomains => certDomains?.length)
    .flat()
    .includes(domain)

  return shouldUpdate ? 'update' : 'add'
}

export default class Generate extends Command {
  static topic = 'certs'
  static description = 'generate a key and a CSR or self-signed certificate'
  static help = 'Generate a key and certificate signing request (or self-signed certificate)\nfor an app. Prompts for information to put in the certificate unless --now\nis used, or at least one of the --subject, --owner, --country, --area, or\n--city options is specified.'
  static flags = {
    selfsigned: flags.boolean({required: false, description: 'generate a self-signed certificate instead of a CSR'}),
    keysize: flags.string({optional: true, description: 'RSA key size in bits (default: 2048)'}),
    owner: flags.string({optional: true, description: 'name of organization certificate belongs to'}),
    country: flags.string({optional: true, description: 'country of owner, as a two-letter ISO country code'}),
    area: flags.string({optional: true, description: 'sub-country area (state, province, etc.) of owner'}),
    city: flags.string({optional: true, description: 'city of owner'}),
    subject: flags.string({optional: true, description: 'specify entire certificate subject'}),
    now: flags.boolean({required: false, description: 'do not prompt for any owner information'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    domain: Args.string({required: true, description: 'The domain name to generate.'}),
  }

  private parsed = this.parse(Generate)

  public async run(): Promise<void> {
    const {flags, args} = await this.parsed
    const {app, selfsigned} = flags
    if (this.requiresPrompt(flags)) {
      const {owner, country, area, city} = await inquirer.prompt([
        {type: 'input', message: 'Owner of this certificate', name: 'owner'},
        {type: 'input', message: 'Country of owner (two-letter ISO code)', name: 'country'},
        {type: 'input', message: 'State/province/etc. of owner', name: 'area'},
        {type: 'input', message: 'City of owner', name: 'city'},
      ])
      Object.assign(flags, {owner, country, area, city})
    }

    const subject = this.getSubject(args, flags)
    const domain = args.domain
    const keysize = flags.keysize || 2048
    const keyfile = `${domain}.key`
    const {body: certs} = await this.heroku.get<SniEndpoint[]>(`/apps/${app}/sni-endpoints`)
    const command = getCommand(certs, domain)
    if (selfsigned) {
      const crtfile = `${domain}.crt`
      await this.spawnOpenSSL(['req', '-new', '-newkey', `rsa:${keysize}`, '-nodes', '-keyout', keyfile, '-out', crtfile, '-subj', subject, '-x509'])
      console.error('Your key and self-signed certificate have been generated.')
      console.error('Next, run:')
      console.error(`$ heroku certs:${command} ${crtfile} ${keyfile}`)
    } else {
      const csrfile = `${domain}.csr`
      await this.spawnOpenSSL(['req', '-new', '-newkey', `rsa:${keysize}`, '-nodes', '-keyout', keyfile, '-out', csrfile, '-subj', subject])
      console.error('Your key and certificate signing request have been generated.')
      console.error(`Submit the CSR in '${csrfile}' to your preferred certificate authority.`)
      console.error('When you\'ve received your certificate, run:')
      console.error(`$ heroku certs:${command} CERTFILE ${keyfile}`)
    }
  }

  protected requiresPrompt(flags: Awaited<typeof this.parsed>['flags']) {
    if (flags.subject) {
      return false
    }

    const args = [flags.owner, flags.country, flags.area, flags.city]
    if (!flags.now && args.every((arg: string | undefined) => !arg)) {
      return true
    }
  }

  protected getSubject(args: Awaited<typeof this.parsed>['args'], flags: Awaited<typeof this.parsed>['flags']) {
    const {domain} = args
    const {owner, country, area, city, subject} = flags
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

  protected async spawnOpenSSL(args: ReadonlyArray<string>) {
    return new Promise((resolve, reject) => {
      const process = spawn('openssl', args, {stdio: 'inherit'})
      process.once('error', reject)
      process.once('close', (code: number) => code ? reject(new Error(`Non zero openssl error ${code}`)) : resolve(code))
    })
  }
}
