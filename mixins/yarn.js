const dirs = require('../lib/dirs')

module.exports = superclass => {
  return class extends superclass {
    yarn (...args) {
      const execa = require('execa')
      const cwd = dirs.plugins
      const stdio = this.debugging ? 'inherit' : null
      this.debug(`${cwd}: ${dirs.yarnBin} ${args.join(' ')}`)
      return execa(dirs.yarnBin, args, {cwd, stdio})
    }
  }
}
