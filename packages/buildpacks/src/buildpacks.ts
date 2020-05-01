import color from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import {BuildpackRegistry} from '@heroku/buildpack-registry'
import {cli} from 'cli-ux'
import {findIndex as lodashFindIndex} from 'lodash'
import {Result} from 'true-myth'

// eslint-disable-next-line node/no-missing-require
const push = require('./push')
const validUrl = require('valid-url')

export type BuildpackResponse = {
  buildpack: {
    url: string;
    name: string;
  };
  ordinal: number;
}

export class BuildpackCommand {
  heroku: APIClient

  registry: BuildpackRegistry

  constructor(heroku: APIClient) {
    this.heroku = heroku
    this.registry = new BuildpackRegistry()
  }

  async fetch(app: string): Promise<any[]> {
    const buildpacks = await this.heroku.get(`/apps/${app}/buildpack-installations`)
    return this.mapBuildpackResponse(buildpacks)
  }

  mapBuildpackResponse(buildpacks: {body: any}): BuildpackResponse[] {
    const body = buildpacks.body
    return body.map((bp: BuildpackResponse) => {
      bp.buildpack.url = bp.buildpack.url.replace(/^urn:buildpack:/, '')
      return bp
    })
  }

  display(buildpacks: BuildpackResponse[], indent: string) {
    if (buildpacks.length === 1) {
      cli.log(this.registryUrlToName(buildpacks[0].buildpack.url, true))
    } else {
      buildpacks.forEach((b, i) => {
        cli.log(`${indent}${i + 1}. ${this.registryUrlToName(b.buildpack.url, true)}`)
      })
    }
  }

  async registryNameToUrl(buildpack: string): Promise<string> {
    if (validUrl.isWebUri(buildpack)) {
      return buildpack
    }

    Result.match({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      Ok: _ => {},
      Err: err => {
        cli.error(`Could not find the buildpack: ${buildpack}. ${err}`, {exit: 1})
      },
    }, BuildpackRegistry.isValidBuildpackSlug(buildpack))

    try {
      const response = await this.registry.buildpackExists(buildpack)
      const body = await response.json()
      return body.blob_url
    } catch (error) {
      if (error.statusCode === 404) {
        cli.error(`${buildpack} is not in the buildpack registry.`, {exit: 1})
      } else if (error.statusCode) {
        cli.error(`${error.statusCode}: ${error.message}`, {exit: 1})
      } else {
        cli.error(error.message, {exit: 1})
      }
    }

    return ''
  }

  async findUrl(buildpacks: BuildpackResponse[], buildpack: string): Promise<number> {
    const mappedUrl = await this.registryNameToUrl(buildpack)
    return lodashFindIndex(buildpacks, (b: BuildpackResponse) => {
      return b.buildpack.url === buildpack || b.buildpack.url === mappedUrl
    })
  }

  async validateUrlNotSet(buildpacks: BuildpackResponse[], buildpack: string) {
    if (await this.findUrl(buildpacks, buildpack) !== -1) {
      cli.error(`The buildpack ${buildpack} is already set on your app.`, {exit: 1})
    }
  }

  findIndex(buildpacks: BuildpackResponse[], index?: number) {
    if (index) {
      return lodashFindIndex(buildpacks, function (b: BuildpackResponse) {
        return b.ordinal + 1 === index
      })
    }
    return -1
  }

  async mutate(app: string, buildpacks: BuildpackResponse[], spliceIndex: number, buildpack: string, command: 'add' | 'set' | 'remove'): Promise<BuildpackResponse[]> {
    const buildpackUpdates = buildpacks.map(function (b: BuildpackResponse) {
      return {buildpack: b.buildpack.url}
    })

    const howmany = (command === 'add') ? 0 : 1
    const urls = (command === 'remove') ? [] : [{buildpack: await this.registryNameToUrl(buildpack)}]

    const indexes: any[] = [spliceIndex, howmany]
    const array: any[] = indexes.concat(urls)
    Array.prototype.splice.apply(buildpackUpdates, array as any)

    return this.put(app, buildpackUpdates)
  }

  async put(app: string, buildpackUpdates: {buildpack: string}[]): Promise<BuildpackResponse[]> {
    const buildpacks = await this.heroku.put(`/apps/${app}/buildpack-installations`, {
      headers: {Range: ''},
      body: {updates: buildpackUpdates},
    })

    return this.mapBuildpackResponse(buildpacks)
  }

  displayUpdate(app: string, remote: string, buildpacks: BuildpackResponse[], action: 'added' | 'set' | 'removed') {
    if (buildpacks.length === 1) {
      cli.log(`Buildpack ${action}. Next release on ${app} will use ${this.registryUrlToName(buildpacks[0].buildpack.url)}.`)
      cli.log(`Run ${color.magenta(push(remote))} to create a new release using this buildpack.`)
    } else {
      cli.log(`Buildpack ${action}. Next release on ${app} will use:`)
      this.display(buildpacks, '  ')
      cli.log(`Run ${color.magenta(push(remote))} to create a new release using these buildpacks.`)
    }
  }

  registryUrlToName(buildpack: string, registryOnly = false): string {
    // eslint-disable-next-line no-useless-escape
    let match = /^https:\/\/buildpack\-registry\.s3\.amazonaws\.com\/buildpacks\/([\w\-]+\/[\w\-]+).tgz$/.exec(buildpack)
    if (match) {
      return match[1]
    }

    if (!registryOnly) {
      // eslint-disable-next-line no-useless-escape
      match = /^https:\/\/codon\-buildpacks\.s3\.amazonaws\.com\/buildpacks\/heroku\/([\w\-]+).tgz$/.exec(buildpack)
      if (match) {
        return `heroku/${match[1]}`
      }
    }

    return buildpack
  }

  async clear(app: string, command: 'clear' | 'remove', action: 'cleared' | 'removed') {
    await this.put(app, [])

    const configVars: any = await this.heroku.get(`/apps/${app}/config-vars`)
    const message = `Buildpack${command === 'clear' ? 's' : ''} ${action}.`
    if (configVars.body.BUILDPACK_URL) {
      cli.log(message)
      cli.warn('The BUILDPACK_URL config var is still set and will be used for the next release')
    } else if (configVars.body.LANGUAGE_PACK_URL) {
      cli.log(message)
      cli.warn('The LANGUAGE_PACK_URL config var is still set and will be used for the next release')
    } else {
      cli.log(`${message} Next release on ${app} will detect buildpacks normally.`)
    }
  }

  validateIndexInRange(buildpacks: BuildpackResponse[], index: number) {
    if (index < 0 || index > buildpacks.length) {
      if (buildpacks.length === 1) {
        cli.error('Invalid index. Only valid value is 1.', {exit: 1})
      } else {
        cli.error(`Invalid index. Please choose a value between 1 and ${buildpacks.length}`, {exit: 1})
      }
    }
  }

  validateIndex(index: number) {
    if (isNaN(index) || index <= 0) {
      cli.error('Invalid index. Must be greater than 0.', {exit: 1})
    }
  }
}
