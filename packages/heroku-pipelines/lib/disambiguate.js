'use strict';

let validator = require('validator');
let inquirer  = require("inquirer");

function *disambiguate(heroku, pipeline_id_or_name) {
  var pipeline;
  if(validator.isUUID(pipeline_id_or_name)) {
    pipeline = yield heroku.pipelines(pipeline_id_or_name).info();
  } else {
    let pipelines = yield heroku.request({
      method: 'GET',
      path: `/pipelines?eq[name]=${pipeline_id_or_name}`
    });
    if(pipelines.length === 0) {
      throw new Error('Pipeline not found');
    } else if (pipelines.length === 1) {
      pipeline = pipelines[0];
    } else {
      // Disambiguate
      let choices = pipelines.map(function(x) {return {name: new Date(x.created_at), value: x};});
      let questions = [{
        type: "list",
        name: "pipeline",
        message: `Which ${pipeline_id_or_name} pipeline?`,
        choices: choices
      }];
      pipeline = yield new Promise(function (resolve, reject) {
        inquirer.prompt( questions, function ( answers ) {
          if (answers.pipeline) resolve(answers.pipeline);
            else reject('Must pick a pipeline');
        });
      });
    }
  }
  return pipeline;
}

module.exports = disambiguate;
