import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/ps/type'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'

describe('ps:type', function () {
  function app(args = {}) {
    const base = {name: 'myapp'}
    return Object.assign(base, args)
  }

  beforeEach(function () {
    nock.cleanAll()
  })

  it('displays cost/hour and max cost/month for all individually-priced dyno sizes', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [
        {type: 'web', quantity: 1, size: 'Eco'},
        {type: 'web', quantity: 1, size: 'Basic'},
        {type: 'web', quantity: 1, size: 'Standard-1X'},
        {type: 'web', quantity: 1, size: 'Standard-2X'},
        {type: 'web', quantity: 1, size: 'Performance-M'},
        {type: 'web', quantity: 1, size: 'Performance-L'},
        {type: 'web', quantity: 1, size: 'Performance-L-RAM'},
        {type: 'web', quantity: 1, size: 'Performance-XL'},
        {type: 'web', quantity: 1, size: 'Performance-2XL'},
      ])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expectOutput(stdout.output, heredoc`
      === Process Types

       Type Size              Qty Cost/hour Max cost/month 
       ──── ───────────────── ─── ───────── ────────────── 
       web  Eco               1                            
       web  Basic             1   ~$0.010   $7             
       web  Standard-1X       1   ~$0.035   $25            
       web  Standard-2X       1   ~$0.069   $50            
       web  Performance-M     1   ~$0.347   $250           
       web  Performance-L     1   ~$0.694   $500           
       web  Performance-L-RAM 1   ~$0.694   $500           
       web  Performance-XL    1   ~$1.042   $750           
       web  Performance-2XL   1   ~$2.083   $1500          
      === Dyno Totals
       Type              Total 
       ───────────────── ───── 
       Eco               1     
       Basic             1     
       Standard-1X       1     
       Standard-2X       1     
       Performance-M     1     
       Performance-L     1     
       Performance-L-RAM 1     
       Performance-XL    1     
       Performance-2XL   1     
      $5 (flat monthly fee, shared across all Eco dynos)
    `)
    api.done()
  })

  it('switches to performance-l-ram dyno', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Eco'}])
      .patch('/apps/myapp/formation', {updates: [{type: 'web', size: 'performance-l-ram'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Performance-L-RAM'}])
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Performance-L-RAM'}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=performance-l-ram',
    ])

    api.done()

    expect(stdout.output).to.eq(heredoc`
      === Process Types

       Type Size              Qty Cost/hour Max cost/month 
       ──── ───────────────── ─── ───────── ────────────── 
       web  Performance-L-RAM 1   ~$0.694   $500           
      === Dyno Totals

       Type              Total 
       ───────────────── ───── 
       Performance-L-RAM 1     
    `)
    expect(stderr.output).to.eq(heredoc`
      Scaling dynos on myapp...
      Scaling dynos on myapp... done
    `)
  })

  it('switches to hobby dynos', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Eco'}, {type: 'worker', quantity: 2, size: 'Eco'}])
      .patch('/apps/myapp/formation', {updates: [{type: 'web', size: 'basic'}, {type: 'worker', size: 'basic'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Basic'}, {type: 'worker', quantity: 2, size: 'Basic'}])
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Basic'}, {type: 'worker', quantity: 2, size: 'Basic'}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'basic',
    ])

    expectOutput(stdout.output, `=== Process Types
 Type   Size  Qty Cost/hour Max cost/month
 ────── ───── ─── ───────── ──────────────
 web    Basic 1   ~$0.010   $7
 worker Basic 2   ~$0.019   $14
=== Dyno Totals
 Type  Total
 ───── ─────
 Basic 3
 `)
    expect(stderr.output).to.include('Scaling dynos on myapp... done\n')
    api.done()
  })

  it('switches to standard-1x and standard-2x dynos', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Eco'}, {type: 'worker', quantity: 2, size: 'Eco'}])
      .patch('/apps/myapp/formation', {updates: [{type: 'web', size: 'standard-1x'}, {type: 'worker', size: 'standard-2x'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Standard-1X'}, {type: 'worker', quantity: 2, size: 'Standard-2X'}])
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Standard-1X'}, {type: 'worker', quantity: 2, size: 'Standard-2X'}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=standard-1x',
      'worker=standard-2x',
    ])

    expectOutput(stdout.output, `=== Process Types
 Type   Size        Qty Cost/hour Max cost/month
 ────── ─────────── ─── ───────── ──────────────
 web    Standard-1X 1   ~$0.035   $25
 worker Standard-2X 2   ~$0.139   $100
=== Dyno Totals
 Type        Total
 ─────────── ─────
 Standard-1X 1
 Standard-2X 2
`)
    expect(stderr.output).to.include('Scaling dynos on myapp... done\n')
    api.done()
  })

  it('displays Shield dynos for apps in shielded spaces', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, app({space: {shield: true}}))
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 0, size: 'Private-M'}, {type: 'web', quantity: 0, size: 'Private-L'}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expectOutput(stdout.output, `=== Process Types
 Type Size     Qty Cost/hour Max cost/month
 ──── ──────── ─── ───────── ──────────────
 web  Shield-M 0
 web  Shield-L 0
=== Dyno Totals
 Type     Total
 ──────── ─────
 Shield-M 0
 Shield-L 0
`)
    api.done()
  })
})
