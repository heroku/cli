// eslint-disable-next-line node/no-extraneous-import
import {NockScope as Scope} from 'fancy-test/lib/types' // this should come from nock, but fancy-test uses nock@13 and we use nock@11

export namespace BuildpackInstallationsStub {
  export function get(nock: Scope, buildpacks?: Array<string | {url: string; name: string}>) {
    let response: any

    if (buildpacks && buildpacks.length > 0) {
      typeof (buildpacks[0]) === 'string' ? (
        response = buildpacks.map((b, i) => {
          return {
            buildpack: {url: b},
            ordinal: i,
          }
        })
      ) : (
        response = buildpacks.map((b, i) => {
          return {
            buildpack: b,
            ordinal: i,
          }
        })
      )
    } else {
      response = []
    }

    nock
      .get('/apps/example/buildpack-installations')
      .reply(200, response)
  }

  export function put(nock: Scope, buildpacks?: Array<string>, registry?: Map<string, {url: string; name: string}>) {
    let updates: Array<{buildpack: string}> = []
    let response: Array<{
      buildpack: {
        url: string;
        name?: string;
      };
      ordinal: number;
    }> = []

    if (buildpacks) {
      updates = buildpacks.map(b => {
        return {buildpack: b}
      })
      response = buildpacks.map((b, index) => {
        let buildpack: {url: string; name?: string} = {url: b}

        if (registry) {
          buildpack = registry.get(b) || {url: b}
        }

        return {buildpack, ordinal: index}
      })
    }

    nock
      .put('/apps/example/buildpack-installations', {updates})
      .reply(200, response)
  }
}
