import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import ux from 'cli-ux'
import * as _ from 'lodash'
import {inspect} from 'util'

const sw = require('string-width')

export interface TableColumn {
  key: string
  header?: string
  extended?: boolean
  get?(cell: any, row: any): string
}

export default abstract class Subject extends Command {
  static flags = {
    columns: flags.string({char: 'c', exclusive: ['extended']}),
    json: flags.boolean({char: 'j'}),
    sort: flags.string({char: 's', description: 'property to sort by'}),
    csv: flags.boolean({exclusive: ['json']}),
    extended: flags.boolean({char: 'x', description: 'show all properties'}),
    'no-header': flags.boolean({exclusive: ['csv', 'json'], description: 'hide header from output'}),
  }

  output(arr: any[], sort: string, columns: TableColumn[]) {
    const {flags} = this.parse(Subject)
    if (flags.sort) sort = flags.sort
    if (flags.extended) {
      columns = _.uniq(_.flatMap(arr, row => Object.keys(row)))
      .map(key => columns.find(c => c.key === key) || ({key}))
    }
    if (flags.columns) {
      columns = flags
      .columns
      .split(',')
      .map(key => {
        const column = columns.find(c => c.key === key) || ({key})
        if (column.extended) column.extended = false
        return column
      })
    }
    arr = arr.map(row => {
      for (let col of columns) {
        let val = _.get(row, col.key)
        if (col.get) val = col.get(val, row)
        _.set(row, col.key, val)
      }
      return row
    })
    arr = _.sortBy(arr, row => {
      let prop = Object
      .entries(row)
      .find(([k]) => k.toLowerCase() === sort.toLowerCase())
      if (prop) return prop[1]
    })
    if (flags.json) return ux.styledJSON(arr)
    const table = arr.map(row => columns.filter(c => flags.extended || !c.extended).map(c => {
      let v = c.get ? row[c.key] : _.get(row, c.key)
      if (v === undefined || v === null) v = ''
      return typeof v === 'string' ? v : inspect(v, {breakLength: Infinity})
    }))
    if (flags.csv) {
      this.csv(arr)
    } else {
      this.table(table, columns, flags)
    }
  }

  csv(table: string[][]) {
    for (let row of table) {
      let first = true
      for (let cell of row) {
        process.stdout.write(first ? '' : ',' + cell)
        first = false
      }
      process.stdout.write('\n')
    }
  }

  table(table: string[][], columns: TableColumn[], options: {extended?: boolean, 'no-header'?: boolean}) {
    const widths = _.map(table[0] || columns, (__, i) => {
      const maxCell = _.maxBy(table.map(row => row[i]), r => sw(r))
      return Math.max((maxCell || '').length, sw(columns[i].key)) + 1
    })
    if (!options['no-header']) {
      let headers = ''
      for (let i = 0; i < columns.length; i++) {
        if (!options.extended && columns[i].extended) continue
        let header = columns[i].header || columns[i].key
        headers += header.padEnd(widths[i])
      }
      this.log(color.bold(headers))
    }
    for (let row of table) {
      for (let i = 0; i < row.length; i++) {
        let o = row[i].padEnd(widths[i])
        process.stdout.write(o)
      }
      process.stdout.write('\n')
    }
  }
}
