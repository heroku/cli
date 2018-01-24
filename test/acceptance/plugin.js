#!/usr/bin/env node

const sh = require('shelljs')
const fs = require('fs-extra')
const path = require('path')
const readPkg = require('read-pkg')

const plugins = ['heroku-ps-exec']

sh.set('-ev')

plugins.forEach(plugin => {
  describe(plugin, () => {
    it('yarn test', () => {
      const cwd = path.join(__dirname, '../../tmp/plugin', plugin)
      sh.rm('-rf', cwd)
      const pkg = readPkg.sync(path.join(__dirname, '../../node_modules', plugin, 'package.json'))
      sh.exec(`git clone ${pkg.repository.url.split('+')[1]} ${cwd}`)
      sh.cd(cwd)
      sh.exec(`git checkout v${pkg.version}`)
      sh.exec('yarn')
      sh.exec('yarn test')
    })
  })
})
