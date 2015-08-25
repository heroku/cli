'use strict';

const stageMap = [
  {
    stage: 'development',
    regex: /-(dev|development)$/
  },{
    stage: 'test',
    regex: /-(uat|tst|test)$/
  },{
    stage: 'qa',
    regex: /-qa$/
  },{
    stage: 'staging',
    regex: /-(stg|staging)$/
  },{
    stage: 'production',
    regex: /-(prd|prod|production|admin|demo)$/
  },{
    stage: 'review',
    regex: /-pr-(\d+)$/
  }
];

module.exports = function infer(app) {
  for (var val of stageMap) {
    if(val.regex.test(app)) {
      return [app.replace(val.regex,""), val.stage];
    }
  }
  return [app,"production"];
};
