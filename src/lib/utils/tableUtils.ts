import {ux} from '@oclif/core'

import parseKeyValue from './keyValueParser.js'

export const constructSortFilterTableOptions = (flags: Record<string, string>, tableColumns: Record<string, any>) => {
  const {filter, sort} = flags
  const columnNames = new Set(Object.keys(tableColumns).map(key => key.toLowerCase()))
  const tableOptions: Record<string, any> = {}

  if (filter) {
    const {key, value} = parseKeyValue(filter)
    const lowerCaseKey = key.toLowerCase()
    if (!value) {
      throw new Error('Filter flag has an invalid value.')
    }

    if (!columnNames.has(lowerCaseKey)) {
      throw new Error(`Invalid filter key: ${key}.`)
    }

    tableOptions.filter = (row: Record<string, any>) => row[lowerCaseKey] === value
  }

  if (sort) {
    const lowerCaseSort = sort.toLowerCase()
    if (!columnNames.has(lowerCaseSort)) {
      throw new Error(`Invalid sort key: ${sort}.`)
    }

    tableOptions.sort = {[lowerCaseSort]: 'asc'}
  }

  return tableOptions
}

const escapeCSV = (value: string) => {
  const needsEscaping = /["\n\r,]/.test(value)
  return needsEscaping ? `"${value.replaceAll('"', '""')}"` : value
}

const getValue = (row: Record<string, any>, key: string, tableColumns: Record<string, any>, config?: Record<string, any>) => {
  const columnConfig = config ?? tableColumns[key]
  return columnConfig?.get?.(row) ?? row[key] ?? ''
}

export const outputCSV = (tableData: Record<string, any>[], tableColumns: Record<string, any>) => {
  const columns = Object.entries(tableColumns)
  const columnHeaders = columns.map(([key, config]) => config.header || key)
  ux.stdout(columnHeaders.join(','))

  for (const row of tableData) {
    const formattedRow = columns.map(([key, config]) => escapeCSV(getValue(row, key, tableColumns, config)))
    ux.stdout(formattedRow.join(','))
  }
}
