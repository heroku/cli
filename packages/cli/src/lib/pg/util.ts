import type {AddOnAttachmentWithConfigVarsAndPlan} from './types'

export function getConfigVarName(configVars: string[]): string {
  const connStringVars = configVars.filter(cv => (cv.endsWith('_URL')))
  if (connStringVars.length === 0) throw new Error('Database URL not found for this addon')
  return connStringVars[0]
}

export const essentialNumPlan = (addon: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(addon?.plan?.name?.split(':')[1].match(/^essential/))
export const legacyEssentialPlan = (addon: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(addon?.plan?.name?.split(':')[1].match(/(dev|basic|mini)$/))

export function essentialPlan(addon:AddOnAttachmentWithConfigVarsAndPlan) {
  return essentialNumPlan(addon) || legacyEssentialPlan(addon)
}
