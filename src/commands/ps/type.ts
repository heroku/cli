import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import _ from 'lodash'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default

const COST_MONTHLY: Record<string, number> = {
  '1X': 36,
  '2X': 72,
  Basic: 7,
  Eco: 0,
  Free: 0,
  Hobby: 7,
  PX: 576,
  Performance: 500,
  'Performance-2XL': 1500,
  'Performance-L': 500,
  'Performance-L-RAM': 500,
  'Performance-M': 250,
  'Performance-XL': 750,
  'Private-L': 900,
  'Private-M': 450,
  'Private-Memory-2XL': 1500,
  'Private-Memory-L': 500,
  'Private-Memory-XL': 750,
  'Private-S': 225,
  'Shield-L': 1080,
  'Shield-M': 540,
  'Shield-Memory-2XL': 1800,
  'Shield-Memory-L': 600,
  'Shield-Memory-XL': 900,
  'Shield-S': 270,
  'Standard-1X': 25,
  'Standard-2X': 50,
  'dyno-1c-0.5gb': 25,
  'dyno-1c-4gb': 80,
  'dyno-1c-8gb': 100,
  'dyno-2c-1gb': 50,
  'dyno-2c-4gb': 150,
  'dyno-2c-8gb': 160,
  'dyno-2c-16gb': 250,
  'dyno-4c-8gb': 300,
  'dyno-4c-16gb': 320,
  'dyno-4c-32gb': 500,
  'dyno-8c-16gb': 600,
  'dyno-8c-32gb': 640,
  'dyno-8c-64gb': 750,
  'dyno-16c-32gb': 1200,
  'dyno-16c-64gb': 1000,
  'dyno-16c-128gb': 1500,
  'dyno-32c-64gb': 2400,
}

const calculateHourly =  (size: string) => COST_MONTHLY[size] / 720

const emptyFormationErr = (app: string) => (
  new Error(`No process types on ${app}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`)
)

const displayFormation = async (heroku: APIClient, app: string) => {
  const {body: formation} = await heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
  const {body: appProps} = await heroku.get<Heroku.App>(`/apps/${app}`)
  const shielded = appProps.space && appProps.space.shield
  const dynoTotals: Record<string, number> = {}
  let isShowingEcoCostMessage = false

  const formationTableData = _.sortBy(formation, 'type')
    // this filter shouldn't be necessary, but it makes TS happy
    .filter((f): f is {quantity: number, size: string} & Heroku.Formation => typeof f.size === 'string' && typeof f.quantity === 'number')
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

      /* eslint-disable perfectionist/sort-objects */
      return {
        // this rule does not realize `size` isn't used on an array
        type: color.name(d.type || ''),
        size: color.info(d.size),
        qty: color.info(`${d.quantity}`),
        'cost/hour': calculateHourly(d.size)
          ? '~$' + (calculateHourly(d.size) * (d.quantity || 1)).toFixed(3).toString()
          : '',
        'max cost/month': COST_MONTHLY[d.size]
          ? '$' + (COST_MONTHLY[d.size] * d.quantity).toString()
          :  '',
      }
      /* eslint-enable perfectionist/sort-objects */
    }))

  const dynoTotalsTableData = Object.keys(dynoTotals)
    .map(k => ({
      // eslint-disable-next-line perfectionist/sort-objects
      type: color.name(k), total: color.info((dynoTotals[k]).toString()),
    }))

  if (formation.length === 0) {
    throw emptyFormationErr(app)
  }

  hux.styledHeader('Process Types')
  /* eslint-disable perfectionist/sort-objects */
  hux.table(formationTableData, {
    type: {},
    size: {},
    qty: {},
    'cost/hour': {},
    'max cost/month': {},
  })
  /* eslint-enable perfectionist/sort-objects */
  ux.stdout()
  hux.styledHeader('Dyno Totals')
  hux.table(dynoTotalsTableData, {
    type: {},
    // eslint-disable-next-line perfectionist/sort-objects
    total: {},
  })

  if (isShowingEcoCostMessage) {
    ux.stdout('\n$5 (flat monthly fee, shared across all Eco dynos)')
  }
}

export default class Type extends Command {
  static aliases = ['ps:resize', 'dyno:resize']
  static description = heredoc`
    manage dyno sizes
    Called with no arguments shows the current dyno size.

    Called with one argument sets the size.
    Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

    Called with 1..n TYPE=SIZE arguments sets the quantity per type.
  `
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static hiddenAliases = ['resize', 'dyno:type']
  static strict = false

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Type)
    const argv = restParse.argv as string[]
    const {app} = flags

    const parse = async () => {
      if (!argv || argv.length === 0)
        return []
      const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
      if (argv.some(a => a.match(/=/))) {
        return _.compact(argv.map(arg => {
          const match = arg.match(/^([a-zA-Z0-9_]+)=([\w-]+)$/)
          const type = match && match[1]
          const size = match && match[2]
          if (!type || !size || !formation.some(p => p.type === type)) {
            throw new Error(`Type ${color.failure(type || '')} not found in process formation.\nTypes: ${color.info(formation.map(f => f.type)
              .join(', '))}`)
          }

          return {type, size}
        }))
      }

      return formation.map(p => ({type: p.type, size: argv[0]}))
    }

    const changes = await parse()

    if (changes.length > 0) {
      ux.action.start(`Scaling dynos on ${color.app(app)}`)
      await this.heroku.patch(`/apps/${app}/formation`, {body: {updates: changes}})
      ux.action.stop()
    }

    await displayFormation(this.heroku, app)
  }
}
