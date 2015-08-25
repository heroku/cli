'use strict';

module.exports = function prompt(questions) {
  let inquirer = require('inquirer');
  return new Promise(function (fulfill) {
    inquirer.prompt(questions, function (answers) {
      fulfill(answers);
    });
  });
};
