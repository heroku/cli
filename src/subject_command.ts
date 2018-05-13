import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {stdtermwidth} from '@oclif/screen'
import ux from 'cli-ux'
import * as _ from 'lodash'
import {inspect} from 'util'

const sw = require('string-width')

export interface TableColumn {
  key: string
  header?: string
  extended?: boolean
  minWidth?: number
  width?: number
  get?(cell: any, row: any): string
}

export default abstract class Subject extends Command {
  static flags = {
    columns: flags.string({char: 'c', exclusive: ['extended']}),
    json: flags.boolean({char: 'j'}),
    sort: flags.string({char: 's', description: 'property to sort by'}),
    csv: flags.boolean({exclusive: ['json']}),
    extended: flags.boolean({char: 'x', description: 'show all properties'}),
    full: flags.boolean({description: 'do not truncate output to fit screen'}),
    'no-header': flags.boolean({exclusive: ['csv', 'json'], description: 'hide header from output'}),
  }

  output(arr: any[], sort: string, columns: TableColumn[]) {
    const {flags} = this.parse(Subject)
    if (flags.sort) sort = flags.sort
    if (flags.extended) {
      columns = _.uniq([...columns.map(c => c.key), ..._.flatMap(arr, row => Object.keys(row))] as string[])
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
    for (let col of columns) {
      col.header = col.header || _.capitalize(col.key.replace('_', ' '))
      if (col.minWidth) col.minWidth = Math.max(col.minWidth, sw(col.header))
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

  table(table: string[][], columns: TableColumn[], options: {extended?: boolean, 'no-header'?: boolean, full?: boolean}) {
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const widths = [columns[i].header, ...table.map(row => row[i])].map(r => sw(r))
      col.width = Math.max(...widths) + 1
    }
    const maxWidth = stdtermwidth
    const shouldShorten = () => {
      if (options.full || !process.stdout.isTTY) return
      if (_.sumBy(columns, c => c.width!) <= maxWidth) return
      for (let col of columns) {
        if (!col.minWidth || col.width === col.minWidth) continue
        return col
      }
    }
    for (let col = shouldShorten(); col; col = shouldShorten()) {
      col.width!--
    }
    if (!options['no-header']) {
      let headers = ''
      for (let col of columns) {
        if (!options.extended && col.extended) continue
        let header = col.header!
        headers += header.padEnd(col.width! + 1)
      }
      this.log(color.bold(headers))
    }
    for (let row of table) {
      for (let i = 0; i < row.length; i++) {
        const width = columns[i].width!
        let o = row[i].padEnd(width)
        if (o.length > width) {
          o = o.slice(0, width - 1) + '…'
        }
        process.stdout.write(o + ' ')
      }
      process.stdout.write('\n')
    }
  }
}
