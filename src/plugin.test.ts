#!/usr/bin/env node

import * as execa from 'execa'
import * as fs from 'fs-extra'
import * as path from 'path'

import { integrationTest } from './__test__/init'

const readPkg = require('read-pkg')

const plugins = ['heroku-ps-exec']

jest.setTimeout(10000000)

Promise.all(
  plugins.map(plugin => {
    integrationTest(plugin, async () => {
      const cwd = path.join(__dirname, '../tmp/plugin', plugin)
      await fs.remove(cwd)
      const pkg = await readPkg(path.join(__dirname, '../node_modules', plugin, 'package.json'))
      await execa('git', ['clone', pkg.repository.url.split('+')[1], cwd])
      const opts = { cwd, stdio: [0, 1, 2] }
      await execa('git', ['checkout', `v${pkg.version}`], opts)
      await execa('yarn', [], opts)
      await execa('yarn', ['test'], opts)
    })
  }),
).catch(err => {
  // tslint:disable-next-line
  console.error(err)
  process.exit(1)
})
