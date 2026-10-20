import {expect} from 'chai'
import {readFileSync} from 'node:fs'

import {
  FIRST_NODE_MAJOR_WITH_V_FLAG,
  isUnsupportedNodeCrash,
  UNSUPPORTED_NODE_ERROR_CODE,
  unsupportedNodeMessage,
} from '../../../src/lib/check-node-version.js'

const regexCrash = () => new SyntaxError('Invalid regular expression flags')
const readRepoFile = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8')

describe('check-node-version', function () {
  describe('isUnsupportedNodeCrash', function () {
    for (const version of ['18.20.8', 'v18.0.0', '16.20.2']) {
      it(`is true for the regex SyntaxError on Node ${version}`, function () {
        expect(isUnsupportedNodeCrash(version, regexCrash())).to.be.true
      })
    }

    for (const version of ['20.0.0', '22.23.3', '24.1.0']) {
      it(`is false for the same error on Node ${version}`, function () {
        expect(isUnsupportedNodeCrash(version, regexCrash())).to.be.false
      })
    }

    it('is false for a JSON.parse SyntaxError on Node 18', function () {
      let error: unknown
      try {
        JSON.parse('{')
      } catch (error_) {
        error = error_
      }

      expect(error).to.be.instanceOf(SyntaxError)
      expect(isUnsupportedNodeCrash('18.20.8', error)).to.be.false
    })

    it('is false for a runtime bad-pattern SyntaxError on Node 18', function () {
      const badPattern = new SyntaxError('Invalid regular expression: /(/: Unterminated group')
      expect(isUnsupportedNodeCrash('18.20.8', badPattern)).to.be.false
    })

    it('is false for non-SyntaxErrors and non-errors on Node 18', function () {
      expect(isUnsupportedNodeCrash('18.20.8', new Error('Invalid regular expression flags'))).to.be.false
      expect(isUnsupportedNodeCrash('18.20.8', new TypeError('x'))).to.be.false
      expect(isUnsupportedNodeCrash('18.20.8', null)).to.be.false
      expect(isUnsupportedNodeCrash('18.20.8', 'Invalid regular expression flags')).to.be.false
    })

    it('fails open on a malformed version', function () {
      expect(isUnsupportedNodeCrash('garbage', regexCrash())).to.be.false
      expect(isUnsupportedNodeCrash('', regexCrash())).to.be.false
    })
  })

  describe('unsupportedNodeMessage', function () {
    it('names the running version, the requirement, and the standalone install link', function () {
      expect(unsupportedNodeMessage('v18.20.8', '>=20')).to.equal("The Heroku CLI doesn't support Node.js v18.20.8. Upgrade to Node.js v20 or later. "
        + 'Or install the standalone Heroku CLI, which includes its own Node.js. '
        + 'See: https://devcenter.heroku.com/articles/heroku-cli')
    })

    const orLater: Array<[string, string]> = [
      ['>=20', 'v20'],
      ['>=20.6', 'v20.6'],
      ['>= 20.6.1', 'v20.6.1'],
      ['>=v22', 'v22'],
    ]
    for (const [range, expected] of orLater) {
      it(`words a minimum-version range as "or later": ${range}`, function () {
        expect(unsupportedNodeMessage('18.20.8', range)).to.include(`Upgrade to Node.js ${expected} or later. Or install`)
      })
    }

    for (const range of ['^20 || ^22', '>=20 <25', '20.x', '>20']) {
      it(`shows any other range verbatim: ${range}`, function () {
        expect(unsupportedNodeMessage('18.20.8', range)).to.include(`Upgrade to a Node.js version matching ${range}. Or install`)
      })
    }

    for (const range of [undefined, '', 20, null, {}] as unknown[]) {
      it(`falls back to generic wording for ${JSON.stringify(range)}`, function () {
        const message = unsupportedNodeMessage('18.20.8', range as string | undefined)
        expect(message).to.include('Upgrade to a newer version of Node.js. Or install')
        expect(message).to.include("doesn't support Node.js v18.20.8")
      })
    }

    it('falls back to generic wording when the range is omitted', function () {
      expect(unsupportedNodeMessage('18.20.8')).to.include('Upgrade to a newer version of Node.js.')
    })
  })

  it('treats Node 20 as the first major supporting the regex v flag', function () {
    expect(FIRST_NODE_MAJOR_WITH_V_FLAG).to.equal(20)
  })

  it('exports the error code used by bin/run.js', function () {
    expect(UNSUPPORTED_NODE_ERROR_CODE).to.equal('HEROKU_UNSUPPORTED_NODE')
  })

  describe('source constraints', function () {
    it('has no imports and no post-Node-16 syntax', function () {
      const source = readRepoFile('src/lib/check-node-version.ts')
      expect(source).not.to.match(/^\s*import\s/m)
      expect(source).not.to.include('?.')
      expect(source).not.to.include('??')
      expect(source).not.to.include('.at(')
    })
  })

  describe('bin/run.js structure', function () {
    const run = readRepoFile('bin/run.js')

    it('only hoists @oclif/core as a static import', function () {
      const staticImports = run.match(/^import [\s\S]*? from '.*'$/gm) ?? []
      expect(staticImports).to.have.lengthOf(1)
      expect(staticImports[0]).to.include('@oclif/core')
    })

    it('loads the guard helper dynamically inside the catch handler', function () {
      expect(run).to.match(/\.catch\(async error => \{[\s\S]*import\('\.\.\/dist\/lib\/check-node-version\.js'\)[\s\S]*handle\(error\)/)
      expect(run).not.to.match(/await execute\(/)
    })

    // The outer try wraps the guard lookup inside the catch handler; the last
    // `} catch` in the file is its catch (an inner try guards the engines read).
    const catchHandlerStart = run.indexOf('.catch(async error => {')
    const tryStart = run.indexOf('try {', catchHandlerStart)
    const catchStart = run.lastIndexOf('} catch')

    it('falls back to handle(error) when the guard helper fails to load', function () {
      expect(catchHandlerStart).to.be.greaterThan(-1)
      expect(tryStart).to.be.greaterThan(catchHandlerStart)
      expect(catchStart).to.be.greaterThan(tryStart)

      // The dynamic import sits inside the try; handle() is only called after it.
      const tryBlock = run.slice(tryStart, catchStart)
      expect(tryBlock).to.include("import('../dist/lib/check-node-version.js')")
      expect(tryBlock).not.to.include('handle(')

      const afterCatch = run.slice(run.indexOf('}', catchStart + '} catch'.length))
      expect(afterCatch).to.match(/return handle\(error\)/)
    })

    it('reads engines.node from package.json inside the try and passes it to the message', function () {
      const tryBlock = run.slice(tryStart, catchStart)
      expect(tryBlock).to.include("new URL('../package.json', import.meta.url)")
      expect(tryBlock).to.include('JSON.parse(')
      expect(tryBlock).to.match(/unsupportedNodeMessage\(process\.versions\.node, enginesRange\)/)
    })

    it('guards the engines read so a failure cannot escape the try', function () {
      const tryBlock = run.slice(tryStart, catchStart)
      const readIndex = tryBlock.indexOf('../package.json')
      const innerTry = tryBlock.lastIndexOf('try {', readIndex)
      const innerCatch = tryBlock.indexOf('} catch', readIndex)
      expect(innerTry).to.be.greaterThan(0)
      expect(innerCatch).to.be.greaterThan(readIndex)
    })
  })
})
