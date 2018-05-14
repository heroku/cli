import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {stdtermwidth} from '@oclif/screen'
import ux from 'cli-ux'
import * as _ from 'lodash'
import {inspect} from 'util'

import list from './list'

const sw = require('string-width')

export type TableColumnOptions = Partial<TableColumn> & {key: string}

export interface TableColumn {
  key: string
  header: string
  extended: boolean
  minWidth?: number
  width: number
  get(cell: any, row: any): string
}

export interface OutputOptions {
  extended?: boolean
  full?: boolean
  header?: boolean
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

  path!: string[]
  async init(): Promise<any> {
    await super.init()
    let [path, ...argv] = this.argv
    this.path = path.slice(1).split(':')
    this.argv = argv
  }

  output(obj: any, options: {sort?: string, columns: TableColumnOptions[]}) {
    const {flags} = this.parse(Subject)
    const addMissingProps = (row: any) => {
      for (let key of Object.keys(row)) {
        if (options.columns.find(c => c.key === key)) continue
        options.columns.push({
          key,
          extended: true,
        })
      }
    }
    if (Array.isArray(obj)) {
      for (let row of obj) addMissingProps(row)
    } else {
      addMissingProps(obj)
    }
    let columns: TableColumn[] = options.columns.map(col => {
      let header = col.header || _.capitalize(col.key.replace('_', ' '))
      if (col.minWidth) col.minWidth = Math.max(col.minWidth, sw(header))
      return {
        extended: false,
        get: (cell: any) => cell,
        ...col,
        header,
        width: 0,
      }
    })
    if (flags.columns) {
      let keys = flags.columns.split(',')
      columns = columns.filter(c => keys.includes(c.key))
    } else if (!flags.extended) {
      columns = columns.filter(c => c.extended)
    }
    options.sort = flags.sort || options.sort
    if (Array.isArray(obj)) return this.outputArray(obj, {sort: options.sort, columns})
    return this.outputObject(obj, {columns})
  }

  outputObject(obj: any, options: {columns: TableColumn[]}) {
    let props = _.uniqBy([
      ...options.columns.map(col => {
        let v = _.get(obj, col.key)
        if (col.get) v = col.get(v, obj)
        return [col.key, v]
      }),
      ...Object.entries(obj).map(([k, v]) => {
        return [k, v]
      }),
    ], ([k]) => k)
    props = props.map(([k, v]) => {
      if (typeof v !== 'string') v = inspect(v)
      const col = options.columns.find(col => col.key === k)
      return [col ? col.header : k, v]
    })
    // TODO: non-tty full-width
    const maxWidth = stdtermwidth
    this.log(list(props, {maxWidth}))
  }

  outputArray(arr: any[], {sort, columns, format}: {sort?: string, columns: TableColumn[], format?: 'table' | 'json' | 'csv'}) {
    arr = arr.map(row => {
      for (let col of columns) {
        let val = _.get(row, col.key)
        val = col.get(val, row)
        if (format !== 'json') val = inspect(val, {breakLength: Infinity})
        _.set(row, col.key, val)
      }
      return row
    })
    if (sort) {
      arr = _.sortBy(arr, row => {
        let prop = Object
        .entries(row)
        .find(([k]) => k.toLowerCase() === sort.toLowerCase())
        if (prop) return prop[1]
      })
    }
    switch (format) {
      case 'json':
        return ux.styledJSON(arr)
      case 'csv':
        return this.csv(arr)
      case 'table':
      default:
        this.table(arr, columns, options)
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
