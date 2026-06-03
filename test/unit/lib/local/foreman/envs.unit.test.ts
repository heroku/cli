import {expect} from 'chai'
import fs from 'node:fs'
import {createRequire} from 'node:module'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const {flattenJSON, keyValue, loadEnvs} = require('../../../../../src/lib/local/foreman/envs.cjs')

describe('vendored foreman envs', function () {
  let tempDir: string

  beforeEach(function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heroku-foreman-envs-'))
  })

  afterEach(function () {
    fs.rmSync(tempDir, {force: true, recursive: true})
  })

  describe('keyValue', function () {
    it('parses basic key=value pairs', function () {
      const result = keyValue('FOO=bar\nBAZ=qux\n')
      expect(result).to.deep.equal({BAZ: 'qux', FOO: 'bar'})
    })

    it('parses double-quoted values', function () {
      const result = keyValue('FOO="hello world"\n')
      expect(result).to.deep.equal({FOO: 'hello world'})
    })

    it('parses single-quoted values', function () {
      const result = keyValue("FOO='hello world'\n")
      expect(result).to.deep.equal({FOO: 'hello world'})
    })

    it('strips inline comments from unquoted values', function () {
      const result = keyValue('FOO=bar # this is a comment\n')
      expect(result).to.deep.equal({FOO: 'bar'})
    })

    it('ignores comment lines', function () {
      const result = keyValue('# a comment\nFOO=bar\n')
      expect(result).to.deep.equal({FOO: 'bar'})
    })

    it('ignores blank lines', function () {
      const result = keyValue('\n\nFOO=bar\n\n')
      expect(result).to.deep.equal({FOO: 'bar'})
    })

    it('handles values containing equals signs', function () {
      const result = keyValue('DATABASE_URL=postgres://user:pass@host/db?opt=val\n')
      expect(result).to.deep.equal({DATABASE_URL: 'postgres://user:pass@host/db?opt=val'})
    })
  })

  describe('flattenJSON', function () {
    it('flattens a simple nested object', function () {
      const result = flattenJSON({top: {middle: 'value'}})
      expect(result).to.deep.equal({TOP_MIDDLE: 'value'})
    })

    it('flattens arrays by index', function () {
      const result = flattenJSON({items: ['a', 'b', 'c']})
      expect(result).to.deep.equal({ITEMS_0: 'a', ITEMS_1: 'b', ITEMS_2: 'c'})
    })

    it('flattens deeply nested structures', function () {
      const result = flattenJSON({a: {b: {c: 42}}})
      expect(result).to.deep.equal({A_B_C: 42})
    })

    it('flattens a flat object', function () {
      const result = flattenJSON({KEY: 'val'})
      expect(result).to.deep.equal({KEY: 'val'})
    })
  })

  describe('loadEnvs', function () {
    it('loads a single env file', function () {
      const envPath = path.join(tempDir, '.env')
      fs.writeFileSync(envPath, 'FOO=bar\nBAZ=qux\n')

      const result = loadEnvs(envPath)
      expect(result.FOO).to.equal('bar')
      expect(result.BAZ).to.equal('qux')
      expect(result.PATH).to.be.a('string')
    })

    it('merges multiple comma-separated env files', function () {
      const env1 = path.join(tempDir, 'first.env')
      const env2 = path.join(tempDir, 'second.env')
      fs.writeFileSync(env1, 'FOO=from_first\nSHARED=first\n')
      fs.writeFileSync(env2, 'BAR=from_second\nSHARED=second\n')

      const result = loadEnvs(env1 + ',' + env2)
      expect(result.FOO).to.equal('from_first')
      expect(result.BAR).to.equal('from_second')
      expect(result.SHARED).to.equal('second')
    })

    it('returns sorted keys', function () {
      const envPath = path.join(tempDir, '.env')
      fs.writeFileSync(envPath, 'ZZZ=last\nAAA=first\nMMM=middle\n')

      const result = loadEnvs(envPath)
      const keys = Object.keys(result)
      const aIdx = keys.indexOf('AAA')
      const mIdx = keys.indexOf('MMM')
      const zIdx = keys.indexOf('ZZZ')
      expect(aIdx).to.be.lessThan(mIdx)
      expect(mIdx).to.be.lessThan(zIdx)
    })

    it('handles a missing env file gracefully', function () {
      const missing = path.join(tempDir, 'nonexistent.env')
      const result = loadEnvs(missing)
      expect(result.PATH).to.be.a('string')
    })

    it('sets PATH from process.env when not in env file', function () {
      const envPath = path.join(tempDir, '.env')
      fs.writeFileSync(envPath, 'FOO=bar\n')

      const result = loadEnvs(envPath)
      expect(result.PATH).to.equal(process.env.PATH)
    })
  })
})
