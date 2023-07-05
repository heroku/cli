import {ux} from '@oclif/core'

export default function setupPipeline(kolkrabbi: any, app: any, settings: any, pipelineID: any, ciSettings: any = {}) {
  const promises = [kolkrabbi.updateAppLink(app, settings)]

  if (ciSettings.ci) {
    promises.push(
      kolkrabbi.updatePipelineRepository(pipelineID, ciSettings),
    )
  }

  return Promise.all(promises).then(([appLink]) => {
    return appLink
  }, error => {
    ux.error(error.body.message || error.message)
  })
}
