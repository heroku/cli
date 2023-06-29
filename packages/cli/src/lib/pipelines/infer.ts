import {inferrableStages as stages} from './stages'

export default function infer(app: string) {
  const inferredStage = stages.find(stage => stage.inferRegex.test(app))

  if (inferredStage) {
    return [app.replace(inferredStage.inferRegex, ''), inferredStage.name]
  }

  return [app, 'production']
}
