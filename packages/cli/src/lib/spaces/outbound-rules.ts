import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export function parsePorts(protocol: string, port: string | undefined) {
  if (port === '-1' || port === 'any') {
    if (protocol === 'icmp') {
      return [0, 255]
    }

    return [0, 65535]
  }

  let actual: any[] = []
  // eslint-disable-next-line no-eq-null, eqeqeq
  if (port != null) {
    const ports: any[] = port.split('-')
    if (ports.length === 2) {
      // eslint-disable-next-line unicorn/prefer-math-trunc
      actual = [ports[0] | 0, ports[1] | 0]
    } else if (ports.length === 1) {
      // eslint-disable-next-line unicorn/prefer-math-trunc
      actual = [ports[0] | 0, ports[0] | 0]
    } else {
      throw new Error('Specified --port range seems incorrect.')
    }
  }

  if (actual.length !== 2) {
    throw new Error('Specified --port range seems incorrect.')
  }

  return actual
}

export function displayRules(space: string, ruleset: Heroku.OutboundRuleset) {
  const rules = ruleset.rules || []
  if (rules.length > 0) {
    ux.styledHeader('Outbound Rules')
    display(ruleset.rules)
  } else {
    ux.styledHeader(`${space} has no Outbound Rules. Your Dynos cannot communicate with hosts outside of ${space}.`)
  }
}

export function displayRulesAsJSON(ruleset: Heroku.OutboundRuleset) {
  ux.log(JSON.stringify(ruleset, null, 2))
}

function display(rules: Heroku.OutboundRuleset['rules']) {
  ux.table(lined(rules), {
    line: {
      header: 'Rule Number',
    },
    target: {
      header: 'Destination',
    },
    from_port: {
      header: 'From Port',
      get: rule => rule.from_port.toString(),
    },
    to_port: {
      header: 'To Port',
      get: rule => rule.to_port.toString(),
    },
    protocol: {
      header: 'Protocol',
    },
  })
}

function lined(rules: Heroku.OutboundRuleset['rules']) {
  const lined = []
  rules = rules || []
  for (let i = 0, len = rules.length; i < len; i++) {
    lined.push({
      line: i + 1,
      target: rules[i].target,
      from_port: rules[i].from_port,
      to_port: rules[i].to_port,
      protocol: rules[i].protocol,
    })
  }

  return lined
}
