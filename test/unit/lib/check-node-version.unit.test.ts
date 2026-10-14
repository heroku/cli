import {expect} from 'chai'
import {readFileSync} from 'node:fs'

import {
  isUnsupportedNodeCrash,
  MIN_NODE_MAJOR,
  UNSUPPORTED_NODE_ERROR_CODE,
  unsupportedNodeMessage,
} from '../../../src/lib/check-node-version.js'

const readRepoFile = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8')

describe('check-node-version', function () {
  const regexCrash = () => new SyntaxError(String.raw`Invalid regular expression: /[\p{L}--[a-z]]/v: Invalid flags`)

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

    it('is false for non-SyntaxErrors and non-errors on Node 18', function () {
      expect(isUnsupportedNodeCrash('18.20.8', new Error('Invalid regular expression'))).to.be.false
      expect(isUnsupportedNodeCrash('18.20.8', new TypeError('x'))).to.be.false
      expect(isUnsupportedNodeCrash('18.20.8', null)).to.be.false
      expect(isUnsupportedNodeCrash('18.20.8', 'Invalid regular expression')).to.be.false
    })

    it('fails open on a malformed version', function () {
      expect(isUnsupportedNodeCrash('garbage', regexCrash())).to.be.false
      expect(isUnsupportedNodeCrash('', regexCrash())).to.be.false
    })
  })

  describe('unsupportedNodeMessage', function () {
    it('names the running version and the minimum', function () {
      const message = unsupportedNodeMessage('v18.20.8')
      expect(message).to.include('Node.js v18.20.8 is not supported')
      expect(message).to.include(`Node.js ${MIN_NODE_MAJOR} or later`)
      expect(message).to.include('https://devcenter.heroku.com/articles/heroku-cli')
    })
  })

  it('keeps MIN_NODE_MAJOR in sync with package.json engines.node', function () {
    const {engines} = JSON.parse(readRepoFile('package.json'))
    expect(engines.node).to.match(/^>=\s*\d+/)
    expect(Number.parseInt(engines.node.replace(/^>=\s*/, ''), 10)).to.equal(MIN_NODE_MAJOR)
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
  })
})
