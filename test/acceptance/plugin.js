#!/usr/bin/env node

const execa = require('execa')
const fs = require('fs-extra')
const path = require('path')
const readPkg = require('read-pkg')

const plugins = ['heroku-ps-exec']

plugins.forEach(plugin => {
  describe(plugin, () => {
    it('yarn test', async () => {
      const cwd = path.join(__dirname, '../tmp/plugin', plugin)
      await fs.remove(cwd)
      const pkg = await readPkg(path.join(__dirname, '../../node_modules', plugin, 'package.json'))
      await execa('git', ['clone', pkg.repository.url.split('+')[1], cwd])
      const opts = { cwd, stdio: [0, 1, 2] }
      await execa('git', ['checkout', `v${pkg.version}`], opts)
      await execa('yarn', [], opts)
      await execa('yarn', ['test'], opts)
    })
  })
})
