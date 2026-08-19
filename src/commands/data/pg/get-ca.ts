import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import fs from 'fs-extra'
import fetch from 'node-fetch'
import os from 'node:os'
import path from 'node:path'

const RDS_CERTIFICATE_HOST = 'https://truststore.pki.rds.amazonaws.com'

export default class DataPgGetCa extends Command {
  static description = 'download the RDS CA bundle for a Heroku region'
  static examples = [
    '<%= config.bin %> <%= command.id %> --region virginia',
    '<%= config.bin %> <%= command.id %> --region global',
  ]
  static flags = {
    region: flags.string({
      description: 'Heroku region or global for the AWS global CA bundle',
      required: true,
    }),
  }

  public async awsRegion(herokuRegion: string): Promise<string> {
    const {body: regions} = await this.heroku.get<Heroku.Region[]>('/regions')
    const region = regions.find(candidate => candidate.name === herokuRegion)
    const awsRegion = region?.provider?.region

    if (!awsRegion) throw new Error(`${herokuRegion} is not a Heroku region backed by AWS.`)

    return awsRegion
  }

  public destinationDirectory(): string {
    if (process.platform === 'win32') {
      if (!process.env.APPDATA) throw new Error('APPDATA is not set; unable to determine the PostgreSQL certificate directory.')

      return path.join(process.env.APPDATA, 'postgresql')
    }

    return path.join(os.homedir(), '.postgres')
  }

  public async download(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`AWS RDS returned ${response.status} ${response.statusText}.`)

    return response.buffer()
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgGetCa)
    const awsRegion = flags.region === 'global' ? 'global' : await this.awsRegion(flags.region)
    const fileName = `${awsRegion}-bundle.pem`
    const destination = path.join(this.destinationDirectory(), fileName)
    const url = `${RDS_CERTIFICATE_HOST}/${awsRegion}/${fileName}`

    try {
      const certificate = await this.download(url)
      await fs.outputFile(destination, certificate, {mode: 0o600})
      this.log(`RDS CA bundle retrieved successfully: ${destination}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(`Unable to retrieve the RDS CA bundle at ${destination}: ${message}`)
    }
  }
}
