// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BuildpackInstallationsStub {
  export function get(nock: any, buildpacks?: Array<string | {name: string; url: string;}>) {
    let response: any

    if (buildpacks && buildpacks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      typeof (buildpacks[0]) === 'string'
        ? (
          response = buildpacks.map((b, i) => ({
            buildpack: {url: b},
            ordinal: i,
          }))
        )
        : (
          response = buildpacks.map((b, i) => ({
            buildpack: b,
            ordinal: i,
          }))
        )
    } else {
      response = []
    }

    nock
      .get('/apps/example/buildpack-installations')
      .reply(200, response)
  }

  export function put(nock: any, buildpacks?: Array<string>, registry?: Map<string, {name: string; url: string;}>) {
    let updates: Array<{buildpack: string}> = []
    let response: Array<{
      buildpack: {
        name?: string;
        url: string;
      };
      ordinal: number;
    }> = []

    if (buildpacks) {
      updates = buildpacks.map(b => ({buildpack: b}))
      response = buildpacks.map((b, index) => {
        let buildpack: {name?: string; url: string;} = {url: b}

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
