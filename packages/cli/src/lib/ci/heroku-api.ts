import {APIClient} from '@heroku-cli/command'

export async function pipelineCoupling(client: APIClient, app: string) {
  return client.get(`/apps/${app}/pipeline-couplings`)
}
