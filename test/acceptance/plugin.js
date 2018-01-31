const sh = require('shelljs')
const path = require('path')

const plugins = [
  {name: 'heroku-ps-exec', repo: 'heroku/heroku-ps-exec'},
]

sh.set('-ev')

plugins.forEach(plugin => {
  describe(plugin.name, () => {
    it('yarn test', function () {
      this.retries(2)
      const cwd = path.join(__dirname, '../../tmp/plugin', plugin.name)
      sh.exec('heroku version')
      sh.exec('which heroku')
      sh.rm('-rf', cwd)
      sh.exec(`git clone git@github.com:${plugin.repo} ${cwd}`)
      sh.cd(cwd)
      const pkg = require(path.join(cwd, 'package.json'))
      sh.exec(`git checkout v${pkg.version}`)
      sh.exec('yarn')
      sh.exec('yarn test')
    })
  })
})
