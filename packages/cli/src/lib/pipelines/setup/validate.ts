export const STAGING_APP_INDICATOR = '-staging'
const PIPELINE_MIN_LENGTH = 2
const PIPELINE_MAX_LENGTH = 30 - STAGING_APP_INDICATOR.length
const ERR_PIPELINE_NAME_LENGTH = `Please choose a pipeline name between 2 and ${PIPELINE_MAX_LENGTH} characters long`
const ERR_REPO_FORMAT = 'Repository name must be in the format organization/repo'

const REPO_REGEX = /.+\/.+/

type ValidatedResponse = [true] | [false, string]

export function pipelineName(name: any): ValidatedResponse {
  const isValid = name.length >= PIPELINE_MIN_LENGTH &&
    name.length <= PIPELINE_MAX_LENGTH

  return isValid ? [isValid] : [isValid, ERR_PIPELINE_NAME_LENGTH]
}

export function repoName(repo: any): ValidatedResponse {
  const isValid = Boolean(repo.match(REPO_REGEX))
  return isValid ? [isValid] : [isValid, ERR_REPO_FORMAT]
}

export function nameAndRepo({name, repo}: {name?: string; repo?: string}) {
  const errors = []
  const [nameIsValid, nameMsg] = pipelineName(name || '')
  const [repoIsValid, repoMsg] = repoName(repo || '')
  if (name && !nameIsValid) errors.push(nameMsg)
  if (repo && !repoIsValid) errors.push(repoMsg)
  return errors
}

