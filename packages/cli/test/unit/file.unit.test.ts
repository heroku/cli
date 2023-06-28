import {expect} from 'chai'
import * as sinon from 'sinon'
import * as file from '../../src/file'
import * as fs from 'fs-extra'

describe('file functions', async () => {
  let renameStub: any
  let removeStub: any
  let readdirStub: any
  let statStub: any
  let statMock: fs.Stats
  let outputJSONStub: any
  let realpathSyncStub: any

  beforeEach(() => {
    renameStub = sinon.stub(fs, 'rename').resolves()
    removeStub = sinon.stub(fs, 'remove').resolves()
    readdirStub = sinon.stub(fs, 'readdir').resolves(['foo'])
    statStub = sinon.stub(fs, 'stat').resolves(statMock)
    outputJSONStub = sinon.stub(fs, 'outputJSON').resolves()
    realpathSyncStub = sinon.stub(fs, 'realpathSync').resolves()
  })

  afterEach(() => {
    renameStub.restore()
    removeStub.restore()
    readdirStub.restore()
    statStub.restore()
    outputJSONStub.restore()
    realpathSyncStub.restore()
  })

  it('executes deps functions', async () => {
    await file.rename('foo', 'bar')
    const removeResult = await file.remove('foo.ts')
    await file.ls('testDir')
    await file.outputJSON('foo', {})
    file.realpathSync('testPath')

    expect(renameStub.calledOnce).to.equal(true)
    expect(removeResult).to.equal(undefined)
    expect(readdirStub.calledOnce).to.equal(true)
    expect(statStub.calledOnce).to.equal(true)
    expect(outputJSONStub.calledOnce).to.equal(true)
    expect(realpathSyncStub.calledOnce).to.equal(true)
  })
})
