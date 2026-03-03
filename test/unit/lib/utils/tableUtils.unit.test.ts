import {ux} from '@oclif/core'
import {expect} from 'chai'
import sinon from 'sinon'

import {constructSortFilterTableOptions, outputCSV} from '../../../../src/lib/utils/tableUtils.js'

describe('constructSortFilterTableOptions', function () {
  const tableColumns = {
    name: {header: 'Name'},
    status: {header: 'Status'},
  }

  it('returns an empty object when no filter or sort flags are provided', function () {
    const result = constructSortFilterTableOptions({}, tableColumns)
    expect(result).to.deep.equal({})
  })

  context('filter flag', function () {
    it('adds a filter function for a valid key=value pair', function () {
      const result = constructSortFilterTableOptions({filter: 'status=active'}, tableColumns)
      expect(result).to.have.property('filter').that.is.a('function')
    })

    it('filter function returns true for a matching row', function () {
      const result = constructSortFilterTableOptions({filter: 'status=active'}, tableColumns)
      expect(result.filter({status: 'active'})).to.equal(true)
    })

    it('filter function returns false for a non-matching row', function () {
      const result = constructSortFilterTableOptions({filter: 'status=active'}, tableColumns)
      expect(result.filter({status: 'inactive'})).to.equal(false)
    })

    it('throws when filter value is missing', function () {
      expect(() => constructSortFilterTableOptions({filter: 'status'}, tableColumns)).to.throw(
        'Filter flag has an invalid value.',
      )
    })

    it('throws when filter key is not a valid column', function () {
      expect(() => constructSortFilterTableOptions({filter: 'unknown=foo'}, tableColumns)).to.throw(
        'Invalid filter key: unknown.',
      )
    })
  })

  context('sort flag', function () {
    it('adds a sort option for a valid column key', function () {
      const result = constructSortFilterTableOptions({sort: 'name'}, tableColumns)
      expect(result).to.deep.include({sort: {name: 'asc'}})
    })

    it('throws when sort key is not a valid column', function () {
      expect(() => constructSortFilterTableOptions({sort: 'unknown'}, tableColumns)).to.throw(
        'Invalid sort key: unknown.',
      )
    })
  })

  it('applies both filter and sort when both flags are valid', function () {
    const result = constructSortFilterTableOptions({filter: 'status=active', sort: 'name'}, tableColumns)
    expect(result).to.have.property('filter').that.is.a('function')
    expect(result).to.deep.include({sort: {name: 'asc'}})
  })
})

describe('outputCSV', function () {
  let stdoutStub: sinon.SinonStub

  beforeEach(function () {
    stdoutStub = sinon.stub(ux, 'stdout')
  })

  afterEach(function () {
    stdoutStub.restore()
  })

  const tableColumns = {
    name: {header: 'Name'},
    status: {header: 'Status'},
  }

  it('outputs the header row using column headers', function () {
    outputCSV([], tableColumns)
    expect(stdoutStub.firstCall.args[0]).to.equal('Name.Status')
  })

  it('falls back to the key as header when no header is configured', function () {
    const cols = {name: {}, status: {}}
    outputCSV([], cols)
    expect(stdoutStub.firstCall.args[0]).to.equal('name.status')
  })

  it('outputs a data row with values joined by commas', function () {
    outputCSV([{name: 'myapp', status: 'active'}], tableColumns)
    expect(stdoutStub.secondCall.args[0]).to.equal('myapp,active')
  })

  it('uses the get function from column config when provided', function () {
    const cols = {
      name: {get: (row: Record<string, any>) => row.name.toUpperCase(), header: 'Name'},
    }
    outputCSV([{name: 'myapp'}], cols)
    expect(stdoutStub.secondCall.args[0]).to.equal('MYAPP')
  })

  it('outputs an empty string for missing row values', function () {
    outputCSV([{name: 'myapp'}], tableColumns)
    expect(stdoutStub.secondCall.args[0]).to.equal('myapp,')
  })

  context('CSV escaping', function () {
    it('wraps values containing a comma in double quotes', function () {
      outputCSV([{name: 'a,b', status: 'ok'}], tableColumns)
      expect(stdoutStub.secondCall.args[0]).to.equal('"a,b",ok')
    })

    it('wraps values containing a double quote and escapes the quote', function () {
      outputCSV([{name: 'say "hi"', status: 'ok'}], tableColumns)
      expect(stdoutStub.secondCall.args[0]).to.equal('"say ""hi""",ok')
    })

    it('wraps values containing a newline in double quotes', function () {
      outputCSV([{name: 'line1\nline2', status: 'ok'}], tableColumns)
      expect(stdoutStub.secondCall.args[0]).to.equal('"line1\nline2",ok')
    })
  })
})
