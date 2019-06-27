import {prompt} from 'inquirer'

export default async function getCISettings(yes: any, organization: any) {
  const settings: any = yes ? {ci: true} : await prompt([{
    type: 'confirm',
    name: 'ci',
    message: 'Enable automatic Heroku CI test runs?'
  }])

  if (settings.ci && organization) {
    settings.organization = organization
  }

  return settings
}
