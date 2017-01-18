'use strict'

module.exports = function prompt (questions) {
  let inquirer = require('inquirer')
  return new Promise(function (resolve) {
    inquirer.prompt(questions, function (answers) {
      resolve(answers)
    })
  })
}
