const {oclif} = require('../../../package.json')

export function getAllVersionFlags() {
  return oclif.additionalVersionFlags
}

export function getAllHelpFlags() {
  return oclif.additionalHelpFlags
}
