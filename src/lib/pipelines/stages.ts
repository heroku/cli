const INFERRABLE_STAGES = [
  {
    inferRegex: /-(dev|development|uat|tst|test|qa)$/,
    name: 'development',
  },
  {
    inferRegex: /-(stg|staging)$/,
    name: 'staging',
  },
  {
    inferRegex: /-(prd|prod|production|admin|demo)$/,
    name: 'production',
  },
]

const INFERRABLE_STAGE_NAMES = INFERRABLE_STAGES.map(stage => stage.name)
const STAGE_NAMES = ['review'].concat(INFERRABLE_STAGE_NAMES)

export {
  INFERRABLE_STAGE_NAMES as inferrableStageNames,
  INFERRABLE_STAGES as inferrableStages,
  STAGE_NAMES as names,
}
