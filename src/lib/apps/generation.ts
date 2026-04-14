import {APIClient} from '@heroku-cli/command'

import Dyno from '../run/dyno.js'
import {
  App, AppGeneration, DynoSize, DynoSizeGeneration, Generation, Pipeline, PipelineGeneration, Space, TeamApp,
} from '../types/fir.js'

export type GenerationKind = 'cedar' | 'fir';
// web.1 web-1234abcde-123ab
export type GenerationLike = AppGeneration | Dyno | DynoSizeGeneration | Generation | PipelineGeneration
export type GenerationCapable = App | DynoSize | Pipeline | Space | TeamApp

function getGenerationFromGenerationLike(generation: GenerationLike | string | undefined): GenerationKind | undefined {
  let maybeGeneration = ''

  if (typeof generation === 'string') {
    maybeGeneration = generation
  } else if (generation && 'name' in generation) {
    maybeGeneration = generation.name ?? ''
  }

  if (/(fir|cedar)/.test(maybeGeneration)) {
    return maybeGeneration as GenerationKind
  }

  // web-1234abcde44-123ab etc. fir
  if (/^web-[0-9a-z]+-[0-9a-z]{5}$/.test(maybeGeneration)) {
    return 'fir'
  }

  // web.n cedar
  if (/^web\.[0-9]+$/.test(maybeGeneration)) {
    return 'cedar'
  }

  return undefined
}

/**
 * Get the generation of an object
 *
 * @param source The object to get the generation from
 * @returns The generation of the object
 */
export function getGeneration(source: GenerationCapable | GenerationLike | string): GenerationKind | undefined {
  if (typeof source === 'object' && 'generation' in source) {
    return getGenerationFromGenerationLike(source.generation)
  }

  return getGenerationFromGenerationLike(source)
}

/**
 * Get the generation of an app by id or name
 *
 * @param appIdOrName The id or name of the app to get the generation for
 * @param herokuApi The Heroku API client to use
 * @returns The generation of the app
 */
export async function getGenerationByAppId(appIdOrName: string, herokuApi: APIClient) {
  const {body: app} = await herokuApi.get<App>(`/apps/${appIdOrName}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
  })
  return getGeneration(app)
}
