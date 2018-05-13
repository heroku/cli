import {Command, flags} from '@heroku-cli/command'
import ux from 'cli-ux'
import * as _ from 'lodash'
import {inspect} from 'util'

const sw = require('string-width')

export interface TableColumn {
  key: string
  extended?: boolean
  get?(cell: any, row: any): string
}

export default abstract class Subject extends Command {
  static flags = {
    columns: flags.string({char: 'c'}),
    json: flags.boolean({char: 'j'}),
    sort: flags.string({char: 's', description: 'property to sort by'}),
    csv: flags.boolean(),
    extended: flags.boolean({char: 'x', description: 'show all properties'}),
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
    arr = _.sortBy(arr, row => {
      let prop = Object
      .entries(row)
      .find(([k]) => k.toLowerCase() === sort.toLowerCase())
      if (prop) return prop[1]
    }
    )
    const table = arr.map(row => columns.filter(c => flags.extended || !c.extended).map(c => {
      let v = _.get(row, c.key)
      if (c.get) v = c.get(v, row)
      if (flags.json) {
        return [c.key, v] as any
      }
      if (v === undefined || v === null) v = ''
      return typeof v === 'string' ? v : inspect(v, {breakLength: Infinity})
    }))
    if (flags.json) ux.styledJSON(table.map(_.fromPairs))
    else if (flags.csv) this.csv(arr)
    else this.table(table)
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

  table(table: string[][]) {
    if (!table.length) return
    const widths = _.map(table[0], (__, i) => sw(_.maxBy(table.map(row => row[i]), r => sw(r)) || '') + 1)
    for (let row of table) {
      for (let i = 0; i < row.length; i++) {
        let o = row[i].padEnd(widths[i])
        process.stdout.write(o)
      }
      process.stdout.write('\n')
    }
  }
}
