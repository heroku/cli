'use strict'

let cli = require('heroku-cli-util')
const { sortBy, compact } = require('lodash')

const costs = { 'Free': 0, 'Eco': 0, 'Hobby': 7, 'Standard-1X': 25, 'Standard-2X': 50, 'Performance-M': 250, 'Performance': 500, 'Performance-L': 500, '1X': 36, '2X': 72, 'PX': 576 }

let emptyFormationErr = (app) => {
  return new Error(`No process types on ${app}.
Upload a Procfile to add process types.
https://devcenter.heroku.com/articles/procfile`)
}

async function run(context, heroku) {
  let app = context.app

  let parse = async function (args) {
    if (args.length === 0) return []
    let formation = await heroku.get(`/apps/${app}/formation`)
    if (args.find((a) => a.match(/=/))) {
      return compact(args.map((arg) => {
        let match = arg.match(/^([a-zA-Z0-9_]+)=([\w-]+)$/)
        let type = match[1]
        let size = match[2]
        if (!formation.find((p) => p.type === type)) {
          throw new Error(`Type ${cli.color.red(type)} not found in process formation.
Types: ${cli.color.yellow(formation.map((f) => f.type).join(', '))}`)
        }
        return { type, size }
      }))
    } else {
      return formation.map((p) => ({ type: p.type, size: args[0] }))
    }
  }

  let displayFormation = async function () {
    let formation = await heroku.get(`/apps/${app}/formation`)
    const appProps = await heroku.get(`/apps/${app}`)
    const shielded = appProps.space && appProps.space.shield

    formation = sortBy(formation, 'type')

    let dynoTotals = [];
    let isShowingEcoCostMessage = false;

    formation.forEach((d) => {
      if (d.size === 'Eco' && d.quantity !== 0) {
        isShowingEcoCostMessage = true;
      }

      if (shielded) {
        d.size = d.size.replace('Private-', 'Shield-')
      }
      if(d.size in dynoTotals) {
        dynoTotals[d.size] += d.quantity;
      } else {
        dynoTotals[d.size] = d.quantity;
      }
    });

    dynoTotals = Object.keys(dynoTotals).map((k) => ({
      type: cli.color.green(k), 
      total: cli.color.yellow(dynoTotals[k])
    }));

    formation = formation.map((d) => ({
      type: cli.color.green(d.type),
      size: cli.color.cyan(d.size),
      qty: cli.color.yellow(d.quantity.toString()),
      'cost/mo': costs[d.size] ? '$' + (costs[d.size] * d.quantity).toString() : ''
    }))


    if (formation.length === 0) throw emptyFormationErr()

    cli.styledHeader('Dyno Types');
    cli.table(formation, {
      columns: [
        { key: 'type' },
        { key: 'size' },
        { key: 'qty' },
        { key: 'cost/mo' }
      ]
    })

    cli.styledHeader('Dyno Totals');

    cli.table(dynoTotals, {
      columns: [
        { key: 'type' },
        { key: 'total' }
      ]
    })

    if (isShowingEcoCostMessage) cli.log('\n$5 (flat monthly fee, shared across all Eco dynos)')
  }

  let changes = await parse(context.args)
  if (changes.length > 0) {
    await cli.action(`Scaling dynos on ${cli.color.app(app)}`,
      heroku.request({ method: 'PATCH', path: `/apps/${app}/formation`, body: { updates: changes } })
    )
  }
  await displayFormation()
}

let cmd = {
  variableArgs: true,
  description: 'manage dyno sizes',
  help: `
Called with no arguments shows the current dyno size.

Called with one argument sets the size.
Where SIZE is one of free|eco|hobby|standard-1x|standard-2x|performance

Called with 1..n TYPE=SIZE arguments sets the quantity per type.
`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(run)
}

module.exports = [
  Object.assign({}, cmd, { topic: 'ps', command: 'type' }),
  Object.assign({}, cmd, { topic: 'ps', command: 'resize' }),
  Object.assign({}, cmd, { topic: 'resize', hidden: true }),
  Object.assign({}, cmd, { topic: 'dyno', command: 'type', hidden: true }),
  Object.assign({}, cmd, { topic: 'dyno', command: 'resize' })
]
