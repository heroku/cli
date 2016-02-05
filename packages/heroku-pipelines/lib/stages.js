const STAGES = [
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
];

exports.stages = STAGES;
exports.names  = STAGES.map((stage) => stage.name);
