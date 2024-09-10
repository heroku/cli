import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {sortBy, compact} from 'lodash'
import heredoc from 'tsheredoc'

const COST_MONTHLY: Record<string, number> = {
  Free: 0,
  Eco: 0,
  Hobby: 7,
  Basic: 7,
  'Standard-1X': 25,
  'Standard-2X': 50,
  'Performance-M': 250,
  Performance: 500,
  'Performance-L': 500,
  '1X': 36,
  '2X': 72,
  PX: 576,
  'Performance-L-RAM': 500,
  'Performance-XL': 750,
  'Performance-2XL': 1500,
}

const calculateHourly =  (size: string) => COST_MONTHLY[size] / 720

const emptyFormationErr = (app: string) => {
  return new Error(`No process types on ${app}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`)
}

const displayFormation = async (heroku: APIClient, app: string) => {
  const {body: formation} = await heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
  const {body: appProps} = await heroku.get<Heroku.App>(`/apps/${app}`)
  const shielded = appProps.space && appProps.space.shield
  const dynoTotals: Record<string, number> = {}
  let isShowingEcoCostMessage = false

  const formationTableData = sortBy(formation, 'type')
    // this filter shouldn't be necessary, but it makes TS happy
    .filter((f): f is Heroku.Formation & {size: string, quantity: number} => typeof f.size === 'string' && typeof f.quantity === 'number')
    .map((d => {
      if (d.size === 'Eco') {
        isShowingEcoCostMessage = true
      }

      if (shielded) {
        d.size = d.size.replace('Private-', 'Shield-')
      }

      if (d.size in dynoTotals) {
        dynoTotals[d.size] += d.quantity
      } else {
        dynoTotals[d.size] = d.quantity
      }

      return {
        // this rule does not realize `size` isn't used on an array
        type: color.green(d.type || ''),
        size: color.cyan(d.size),
        qty: color.yellow(`${d.quantity}`),
        'cost/hour': calculateHourly(d.size) ?
          '~$' + (calculateHourly(d.size) * (d.quantity || 1)).toFixed(3)
            .toString() :
          '',
        'max cost/month': COST_MONTHLY[d.size] ?
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          '$' + (COST_MONTHLY[d.size] * d.quantity).toString() :
          '',
      }
    }))

  const dynoTotalsTableData = Object.keys(dynoTotals)
    .map(k => ({
      type: color.green(k), total: color.yellow((dynoTotals[k]).toString()),
    }))

  if (formation.length === 0) {
    throw emptyFormationErr(app)
  }

  ux.styledHeader('Dyno Types')
  ux.table(formationTableData, {
    type: {},
    size: {},
    qty: {},
    'cost/hour': {},
    'max cost/month': {},
  })

  ux.styledHeader('Dyno Totals')
  ux.table(dynoTotalsTableData, {
    type: {},
    total: {},
  })

  if (isShowingEcoCostMessage) {
    ux.log('\n$5 (flat monthly fee, shared across all Eco dynos)')
  }
}

export default class Type extends Command {
  static strict = false
  static description = heredoc`
    manage dyno sizes
    Called with no arguments shows the current dyno size.

    Called with one argument sets the size.
    Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

    Called with 1..n TYPE=SIZE arguments sets the quantity per type.
  `
  static aliases = ['ps:resize', 'dyno:resize']
  static hiddenAliases = ['resize', 'dyno:type']
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Type)
    const argv = restParse.argv as string[]
    const {app} = flags

    const parse = async () => {
      if (!argv || argv.length === 0)
        return []
      const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
      if (argv.some(a => a.match(/=/))) {
        return compact(argv.map(arg => {
          const match = arg.match(/^([a-zA-Z0-9_]+)=([\w-]+)$/)
          const type = match && match[1]
          const size = match && match[2]
          if (!type || !size || !formation.some(p => p.type === type)) {
            throw new Error(`Type ${color.red(type || '')} not found in process formation.\nTypes: ${color.yellow(formation.map(f => f.type)
              .join(', '))}`)
          }

          return {type, size}
        }))
      }

      return formation.map(p => ({type: p.type, size: argv[0]}))
    }

    const changes = await parse()

    if (changes.length > 0) {
      ux.action.start(`Scaling dynos on ${color.magenta(app)}`)
      await this.heroku.patch(`/apps/${app}/formation`, {body: {updates: changes}})
      ux.action.stop()
    }

    await displayFormation(this.heroku, app)
  }
}
