const INFERRABLE_STAGES = [
  {
    name: 'development',
    inferRegex: /-(dev|development|uat|tst|test|qa)$/
  },
  {
    name: 'staging',
    inferRegex: /-(stg|staging)$/
  },
  {
    name: 'production',
    inferRegex: /-(prd|prod|production|admin|demo)$/
  }
]

const INFERRABLE_STAGE_NAMES = INFERRABLE_STAGES.map((stage) => stage.name)
const STAGE_NAMES = ['review'].concat(INFERRABLE_STAGE_NAMES)

exports.inferrableStages = INFERRABLE_STAGES
exports.inferrableStageNames = INFERRABLE_STAGE_NAMES
exports.names = STAGE_NAMES
