const inquirer = require('inquirer')

module.exports = function prompt (questions) {
  return inquirer.prompt(questions)
}
