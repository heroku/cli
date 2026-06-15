import * as Heroku from '@heroku-cli/schema'
import {pg, utils} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

interface Plan {
  plan: Heroku.AddOn['plan']
}

export async function ensurePGStatStatement(db: pg.ConnectionDetails): Promise<void> {
  try {
    const query = `
SELECT exists(
  SELECT 1 FROM pg_extension e LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname='pg_stat_statements' AND n.nspname = 'public'
) AS available`
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(query)

    if (!output.includes('t')) {
      ux.error(`pg_stat_statements extension need to be installed in the public schema first.
You can install it by running:

    CREATE EXTENSION pg_stat_statements;`, {exit: 1})
    }
  } catch {
    ux.error('Failed to check pg_stat_statements extension availability', {exit: 1})
  }
}

export async function ensureEssentialTierPlan(db: pg.ConnectionDetails): Promise<void> {
  const planName = db.attachment?.addon?.plan?.name

  if (!planName) {
    ux.error('Unable to determine database plan type', {exit: 1})
    return
  }

  if (/(dev|basic|essential-\d+)$/.test(planName)) {
    ux.error('This operation is not supported by Essential-tier databases.', {exit: 1})
  }
}

export function essentialNumPlan(a: Plan): boolean {
  if (!a.plan?.name) return false
  const parts = a.plan.name.split(':')
  if (parts.length < 2) return false
  return Boolean(parts[1].startsWith('essential'))
}

export async function newTotalExecTimeField(db: pg.ConnectionDetails): Promise<boolean> {
  try {
    const newTotalExecTimeFieldQuery = 'SELECT current_setting(\'server_version_num\')::numeric >= 130000'
    const psqlService = new utils.pg.PsqlService(db)
    const newTotalExecTimeFieldRaw = await psqlService.execQuery(newTotalExecTimeFieldQuery, ['-t', '-q'])

    // error checks
    const newTotalExecTimeField = newTotalExecTimeFieldRaw.split('\n')[0].trim()

    if (newTotalExecTimeField !== 't' && newTotalExecTimeField !== 'f') {
      ux.error(`Unable to determine database version, expected "t" or "f", got: "${newTotalExecTimeField}"`, {exit: 1})
    }

    return newTotalExecTimeField === 't'
  } catch {
    ux.error('Failed to determine database version for total execution time field', {exit: 1})
    return false // This will never be reached due to ux.error exit
  }
}

export async function newBlkTimeFields(db: pg.ConnectionDetails): Promise<boolean> {
  try {
    const newBlkTimeFieldsQuery = 'SELECT current_setting(\'server_version_num\')::numeric >= 170000'
    const psqlService = new utils.pg.PsqlService(db)
    const newBlkTimeFieldsRaw = await psqlService.execQuery(newBlkTimeFieldsQuery, ['-t', '-q'])

    // error checks
    const newBlkTimeField = newBlkTimeFieldsRaw.split('\n')[0].trim()

    if (newBlkTimeField !== 't' && newBlkTimeField !== 'f') {
      ux.error(`Unable to determine database version, expected "t" or "f", got: "${newBlkTimeField}"`, {exit: 1})
    }

    return newBlkTimeField === 't'
  } catch {
    ux.error('Failed to determine database version for block time fields', {exit: 1})
    return false // This will never be reached due to ux.error exit
  }
}
