import {Hook} from '@oclif/core'

// TODO: Add open telemetry instance
// import Analytics from '../../analytics'

export const collection_and_post: Hook<'performance_telemetry'> = async function (options) {
// TODO: log out command config data
  const {type: commandName, config: commandConfig} = options
  console.log('type:', commandName)
  console.log('config:', commandConfig)
// TODO: capture command errors
//   const analytics = new Analytics(this.config)
//   await analytics.record(options)
}
