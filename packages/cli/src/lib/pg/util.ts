export function getConfigVarName(configVars: string[]) {
  const connstringVars = configVars.filter(cv => (cv.endsWith('_URL')))
  if (connstringVars.length === 0) throw new Error('Database URL not found for this addon')
  return connstringVars[0]
}
