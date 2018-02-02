#!/usr/bin/env node

// const path = require('path')
// const sh = require('shelljs')
// const {expect} = require('chai')
// const _ = require('lodash')
// import {expect} from 'chai'
// import * as _ from 'lodash'

// const bin = path.join(__dirname, '../../bin/run')

// function run(args= '') {
//   console.log(`$ heroku ${args}`)
//   return sh.exec([bin, args].join(' '))
// }

it.skip('heroku version', () => {
  // const {stdout} = run('version')
  // expect(stdout).to.match(/^heroku-cli\//)
})

// it('heroku help', async () => {
//   const {stdout} = await run('help')
//   expect(stdout).to.match(/^Usage: heroku COMMAND/)
// })

// it('heroku auth:whoami', async () => {
//   const {stdout} = await run('help')
//   expect(stdout).to.match(/^Usage: heroku COMMAND/)
// })

// it('heroku apps && heroku apps info && heroku run', async () => {
//   let cmd = await run(['apps'])
//   expect(cmd.stdout).to.match(/^===.*Apps/)
//   let apps = cmd.stdout
//     .split('\n')
//     .slice(1, -1)
//     .filter(a => !a.match(/===/) && a)
//   let app = _.sample(apps)
//   if (!app) throw new Error(`no app found, got ${cmd.stdout}`)
//   app = app.split(' ')[0]
//   const appFlag = `-a=${app}`
//   expect((await run(['info', appFlag].join(' '))).stdout).to.contain(`=== ${app}`)
//   expect((await run(['run', '--exit-code', appFlag, 'echo', 'it works!'].join(' '))).stdout).to.match(/^it works!/)
// })
