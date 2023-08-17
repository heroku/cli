const {oclif} = require('../../../package.json')

export function getAllVersionFlags() {
  return [...oclif.additionalVersionFlags, '--version']
}

export function getAllHelpFlags() {
  return oclif.additionalHelpFlags
}
