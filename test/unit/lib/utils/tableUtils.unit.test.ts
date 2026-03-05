import {ux} from '@oclif/core'
import {expect} from 'chai'
import sinon from 'sinon'

import {constructSortFilterTableOptions, constructTableColumns, outputCSV} from '../../../../src/lib/utils/tableUtils.js'

describe('tableUtils', function () {
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
        try {
          constructSortFilterTableOptions({filter: 'status'}, tableColumns)
        } catch (error: any) {
          expect(error.message).to.equal('Filter flag has an invalid value')
        }
      })

      it('throws when filter key is not a valid column', function () {
        try {
          constructSortFilterTableOptions({filter: 'unknown=foo'}, tableColumns)
        } catch (error: any) {
          expect(error.message).to.equal('Invalid filter key: unknown')
        }
      })
    })

    context('sort flag', function () {
      it('adds a sort option for a valid column key', function () {
        const result = constructSortFilterTableOptions({sort: 'name'}, tableColumns)
        expect(result).to.deep.include({sort: {name: 'asc'}})
      })

      it('throws when sort key is not a valid column', function () {
        try {
          constructSortFilterTableOptions({sort: 'unknown'}, tableColumns)
        } catch (error: any) {
          expect(error.message).to.equal('Invalid sort key: unknown')
        }
      })
    })

    it('applies both filter and sort when both flags are valid', function () {
      const result = constructSortFilterTableOptions({filter: 'status=active', sort: 'name'}, tableColumns)
      expect(result).to.have.property('filter').that.is.a('function')
      expect(result).to.deep.include({sort: {name: 'asc'}})
    })
  })

  describe('constructTableColumns', function () {
    const allTableColumns = {
      created_at: {header: 'Created At'},
      name: {header: 'Name'},
      region: {header: 'Region'},
      status: {header: 'Status'},
    }
    const baseColumnNames = ['name', 'status']

    context('columns flag provided', function () {
      it('throws when the columns array is empty', function () {
        try {
          constructTableColumns(allTableColumns, baseColumnNames, false, [])
        } catch (error: any) {
          expect(error.message).to.equal('Column flag has no column names')
        }
      })

      it('throws when none of the provided columns match any valid column', function () {
        try {
          constructTableColumns(allTableColumns, baseColumnNames, false, ['unknown'])
        } catch (error: any) {
          expect(error.message).to.equal('Column flag has an invalid column name: unknown')
        }
      })

      it('returns only the specified columns', function () {
        const result = constructTableColumns(allTableColumns, baseColumnNames, false, ['name', 'region'])
        expect(result).to.deep.equal({
          name: allTableColumns.name,
          region: allTableColumns.region,
        })
      })

      it('returns only the specified columns regardless of capitalization of the column name', function () {
        const result = constructTableColumns(allTableColumns, baseColumnNames, false, ['Name', 'Region'])
        expect(result).to.deep.equal({
          name: allTableColumns.name,
          region: allTableColumns.region,
        })
      })

      it('throws when any of the provided columns do not match any valid column', function () {
        try {
          constructTableColumns(allTableColumns, baseColumnNames, false, ['name', 'unknown'])
        } catch (error: any) {
          expect(error.message).to.equal('Column flag has an invalid column name: unknown')
        }
      })

      it('ignores extended flag when columns are provided', function () {
        const result = constructTableColumns(allTableColumns, baseColumnNames, true, ['status'])
        expect(result).to.deep.equal({status: allTableColumns.status})
      })
    })

    context('no columns flag', function () {
      it('returns all columns when extended is true', function () {
        const result = constructTableColumns(allTableColumns, baseColumnNames, true)
        expect(result).to.deep.equal(allTableColumns)
      })

      it('returns only base columns when extended is false', function () {
        const result = constructTableColumns(allTableColumns, baseColumnNames, false)
        expect(result).to.deep.equal({
          name: allTableColumns.name,
          status: allTableColumns.status,
        })
      })
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
      expect(stdoutStub.firstCall.args[0]).to.equal('Name,Status')
    })

    it('falls back to the key as header when no header is configured', function () {
      const cols = {name: {}, status: {}}
      outputCSV([], cols)
      expect(stdoutStub.firstCall.args[0]).to.equal('name,status')
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
})
