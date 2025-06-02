import {runCommand} from '@oclif/test'
import {expect} from 'chai'

// describe('authorizations:create', function () {
//   it('creates the authorization', async function () {
//     const {stdout} = await runCommand(['authorizations:create', '--description', 'awesome'])
//     expect(stdout).to.contain('Client:      <none>\n')
//     expect(stdout).to.contain('Scope:       global\n')
//     expect(stdout).to.contain('Token:       secrettoken\n')
//   })

//   it('only prints token with short flag', async function () {
//     const {stdout} = await runCommand(['authorizations:create', '--expires-in', '10000', '--short'])
//     expect(stdout).to.equal('secrettoken\n')
//   })

//   it('prints json with json flag', async function () {
//     const {stdout} = await runCommand(['authorizations:create', '--json'])
//     const json = JSON.parse(stdout)
//     expect(json.access_token).to.contain({token: 'secrettoken'})
//     expect(json.scope).to.contain('global')
//   })
// })
