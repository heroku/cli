import {BuildpackRegistry} from '@heroku/buildpack-registry'
import {color} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import _ from 'lodash'

import {OciImage} from '../../lib/types/fir.js'
import push from '../git/push.js'

export type BuildpackResponse = {
  buildpack: {
    name: string;
    url: string;
  };
  ordinal: number;
}

// Simple URL validation function that returns boolean
function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return Boolean(urlObj)
  } catch {
    return false
  }
}

export class BuildpackCommand {
  heroku: APIClient

  registry: BuildpackRegistry

  constructor(heroku: APIClient) {
    this.heroku = heroku
    this.registry = new BuildpackRegistry()
  }

  async clear(app: string, command: 'clear' | 'remove', action: 'cleared' | 'removed') {
    await this.put(app, [])

    const configVars: any = await this.heroku.get(`/apps/${app}/config-vars`)
    const message = `Buildpack${command === 'clear' ? 's' : ''} ${action}.`
    if (configVars.body.BUILDPACK_URL) {
      ux.stdout(message)
      ux.warn('The BUILDPACK_URL config var is still set and will be used for the next release')
    } else if (configVars.body.LANGUAGE_PACK_URL) {
      ux.stdout(message)
      ux.warn('The LANGUAGE_PACK_URL config var is still set and will be used for the next release')
    } else {
      ux.stdout(`${message} Next release on ${color.app(app)} will detect buildpacks normally.`)
    }
  }

  display(buildpacks: BuildpackResponse[], indent: string) {
    if (buildpacks.length === 1) {
      ux.stdout(this.registryUrlToName(buildpacks[0].buildpack.url, true))
    } else {
      buildpacks.forEach((b, i) => {
        ux.stdout(`${indent}${i + 1}. ${this.registryUrlToName(b.buildpack.url, true)}`)
      })
    }
  }

  displayUpdate(app: string, remote: string, buildpacks: BuildpackResponse[], action: 'added' | 'removed' | 'set') {
    if (buildpacks.length === 1) {
      ux.stdout(`Buildpack ${action}. Next release on ⬢ ${color.app(app)} will use ${this.registryUrlToName(buildpacks[0].buildpack.url)}.`)
      ux.stdout(`Run ${color.code(push(remote))} to create a new release using this buildpack.`)
    } else {
      ux.stdout(`Buildpack ${action}. Next release on ⬢ ${color.app(app)} will use:`)
      this.display(buildpacks, '  ')
      ux.stdout(`Run ${color.code(push(remote))} to create a new release using these buildpacks.`)
    }
  }

  async fetch(app: string, isFirApp = false): Promise<any[]> {
    let buildpacks: any
    if (isFirApp) {
      const {body: releases} = await this.heroku.request<Heroku.Release[]>(`/apps/${app}/releases`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          Range: 'version ..; max=10, order=desc',
        },
        partial: true,
      })
      if (releases.length === 0 || releases[0].oci_image === null) return []
      const latestImageId = releases[0].oci_image.id
      const {body: ociImages} = await this.heroku.get<OciImage[]>(`/apps/${app}/oci-images/${latestImageId}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })
      buildpacks = ociImages[0].buildpacks.map((b, index) => ({
        buildpack: {
          url: b.id || b.homepage,
          name: b.id,
        },
        ordinal: index,
      }))
    } else {
      const {body: buildpackInstallations} = await this.heroku.get(`/apps/${app}/buildpack-installations`)
      buildpacks = buildpackInstallations
    }

    return this.mapBuildpackResponse(buildpacks)
  }

  findIndex(buildpacks: BuildpackResponse[], index?: number) {
    if (index) {
      return _.findIndex(buildpacks, (b: BuildpackResponse) => b.ordinal + 1 === index)
    }

    return -1
  }

  async findUrl(buildpacks: BuildpackResponse[], buildpack: string): Promise<number> {
    const mappedUrl = await this.registryNameToUrl(buildpack)
    return _.findIndex(buildpacks, (b: BuildpackResponse) => b.buildpack.url === buildpack || b.buildpack.url === mappedUrl)
  }

  mapBuildpackResponse(buildpacks: BuildpackResponse[]): BuildpackResponse[] {
    return buildpacks.map((bp: BuildpackResponse) => {
      bp.buildpack.url = bp.buildpack.url.replace(/^urn:buildpack:/, '')
      return bp
    })
  }

  async mutate(app: string, buildpacks: BuildpackResponse[], spliceIndex: number, buildpack: string, command: 'add' | 'remove' | 'set'): Promise<BuildpackResponse[]> {
    const buildpackUpdates = buildpacks.map((b: BuildpackResponse) => ({buildpack: b.buildpack.url}))

    const howmany = (command === 'add') ? 0 : 1
    const urls = (command === 'remove') ? [] : [{buildpack: await this.registryNameToUrl(buildpack)}]

    const indexes: any[] = [spliceIndex, howmany]
    const array: any[] = indexes.concat(urls)
    Array.prototype.splice.apply(buildpackUpdates, array as any)

    return this.put(app, buildpackUpdates)
  }

  async put(app: string, buildpackUpdates: {buildpack: string}[]): Promise<BuildpackResponse[]> {
    const {body: buildpacks} = await this.heroku.put<any>(`/apps/${app}/buildpack-installations`, {
      body: {updates: buildpackUpdates},
      headers: {Range: ''},
    })

    return this.mapBuildpackResponse(buildpacks)
  }

  async registryNameToUrl(buildpack: string): Promise<string> {
    if (isValidURL(buildpack)) {
      return buildpack
    }

    const validationResult = BuildpackRegistry.isValidBuildpackSlug(buildpack)
    if (!validationResult.isOk) {
      ux.error(`Could not find the buildpack: ${buildpack}. ${(validationResult as any).error}`, {exit: 1})
    }

    try {
      const response = await this.registry.buildpackExists(buildpack)
      const body = await response.json()
      return body.blob_url
    } catch (error: any) {
      if (error.statusCode === 404) {
        ux.error(`${buildpack} is not in the buildpack registry.`, {exit: 1})
      } else if (error.statusCode) {
        ux.error(`${error.statusCode}: ${error.message}`, {exit: 1})
      } else {
        ux.error(error.message, {exit: 1})
      }
    }

    return ''
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

  validateIndex(index: number) {
    if (Number.isNaN(index) || index <= 0) {
      ux.error('Invalid index. Must be greater than 0.', {exit: 1})
    }
  }

  validateIndexInRange(buildpacks: BuildpackResponse[], index: number) {
    if (index < 0 || index > buildpacks.length) {
      if (buildpacks.length === 1) {
        ux.error('Invalid index. Only valid value is 1.', {exit: 1})
      } else {
        ux.error(`Invalid index. Please choose a value between 1 and ${buildpacks.length}`, {exit: 1})
      }
    }
  }

  async validateUrlNotSet(buildpacks: BuildpackResponse[], buildpack: string) {
    if (await this.findUrl(buildpacks, buildpack) !== -1) {
      ux.error(`The buildpack ${buildpack} is already set on your app.`, {exit: 1})
    }
  }
}
