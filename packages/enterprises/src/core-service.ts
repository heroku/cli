import {APIClient} from '@heroku-cli/command'

export class CoreService {
  readonly heroku: APIClient

  constructor(heroku: APIClient) {
    this.heroku = heroku
  }

  async getEnterpriseAccountId(enterpriseAccountName: string): Promise<string> {
    const {body: enterpriseAccount} = await this.heroku.get<any>(`/enterprise-accounts/${enterpriseAccountName}`)
    return enterpriseAccount.id
  }

  async getTeamId(teamName: string): Promise<string> {
    const {body: team} = await this.heroku.get<any>(`/teams/${teamName}`)
    return team.id
  }
}
