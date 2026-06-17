import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {
  createSandbox, SinonSandbox, SinonStub,
} from 'sinon'

import Cmd, {generateMandelbrotQuery} from '../../../../src/commands/pg/mandelbrot.js'

describe('pg:mandelbrot', function () {
  let sandbox: SinonSandbox
  let getDatabaseStub: SinonStub
  let execQueryStub: SinonStub
  const expectedOutput = [
    '          ....,,,,----++++',
    '       ...,,,----++++%%%%@',
    '     ..,,,---+++%%%@@@####@',
  ].join('\n')

  const mockDb: pg.ConnectionDetails = {
    database: 'testdb',
    host: 'localhost',
    password: 'testpass',
    pathname: '/testdb',
    port: '5432',
    url: 'postgres://localhost:5432/testdb',
    user: 'testuser',
  }

  beforeEach(function () {
    sandbox = createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves(expectedOutput)
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('generateMandelbrotQuery', function () {
    it('generates the exact expected SQL query', function () {
      const expectedQuery = `WITH RECURSIVE Z(IX, IY, CX, CY, X, Y, I) AS (
            SELECT IX, IY, X::float, Y::float, X::float, Y::float, 0
            FROM (select -2.2 + 0.031 * i, i from generate_series(0,101) as i) as xgen(x,ix),
                 (select -1.5 + 0.031 * i, i from generate_series(0,101) as i) as ygen(y,iy)
            UNION ALL
            SELECT IX, IY, CX, CY, X * X - Y * Y + CX AS X, Y * X * 2 + CY, I + 1
            FROM Z
            WHERE X * X + Y * Y < 16::float
            AND I < 100
      )
SELECT array_to_string(array_agg(SUBSTRING(' .,,,-----++++%%%%@@@@#### ', LEAST(GREATEST(I,1),27), 1)),'')
FROM (
      SELECT IX, IY, MAX(I) AS I
      FROM Z
      GROUP BY IY, IX
      ORDER BY IY, IX
     ) AS ZT
GROUP BY IY
ORDER BY IY`

      expect(generateMandelbrotQuery()).to.equal(expectedQuery)
    })

    it('generates SQL with the expected clauses', function () {
      const query = generateMandelbrotQuery()
      expect(query).to.contain('RECURSIVE Z')
      expect(query).to.contain('generate_series')
    })
  })

  describe('command behavior', function () {
    it('displays the mandelbrot set', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(getDatabaseStub.calledOnceWith('myapp')).to.be.true
      expect(execQueryStub.calledOnce).to.be.true
      expect(execQueryStub.getCall(0).args[0]).to.eq(generateMandelbrotQuery())
      expect(stdout).to.contain(expectedOutput)
      expect(stderr).to.eq('')
    })

    it('accepts a database argument', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-123',
      ])

      expect(getDatabaseStub.calledOnce).to.be.true
      expect(getDatabaseStub.getCall(0).args[1]).to.eq('postgres-123')
    })
  })

  describe('error handling', function () {
    it('surfaces database connection failures', async function () {
      getDatabaseStub.rejects(new Error('Database connection failed'))
      const {error} = await runCommand(Cmd, ['--app', 'myapp'])
      expect(error?.message).to.contain('Database connection failed')
    })

    it('surfaces SQL execution failures', async function () {
      execQueryStub.rejects(new Error('SQL execution failed'))
      const {error} = await runCommand(Cmd, ['--app', 'myapp'])
      expect(error?.message).to.contain('SQL execution failed')
    })
  })
})
