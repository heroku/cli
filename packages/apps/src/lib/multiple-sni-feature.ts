import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'

const MULTIPLE_SNI_ENDPOINT_FLAG = 'allow-multiple-sni-endpoints'

export default async function multipleSniEndpointsEnabled(heroku: APIClient, appName: string) {
  const {body: featureList} = await heroku.get<Array<Heroku.AppFeature>>(`/apps/${appName}/features`)

  const multipleSniEndpointFeature = featureList.find(feature => feature.name === MULTIPLE_SNI_ENDPOINT_FLAG)

  return Boolean(multipleSniEndpointFeature && multipleSniEndpointFeature.enabled)
}
