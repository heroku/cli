import * as _ from 'lodash'

import SubjectCommand from '../../subject_command'

export class AppsList extends SubjectCommand {
  async run() {
    const {body: apps} = await this.heroku.get('/apps')
    this.output(apps, 'name', [
      {key: 'name'},
      {
        key: 'description',
        get: (_, row) => row.buildpack_provided_description
      },
      {
        key: 'owner',
        get: (owner, row) => {
          const team = _.get(row, 'team.name')
          if (owner.email.endsWith('@herokumanager.com') && team) return team
          return owner.email
        }
      },
      {
        key: 'build_stack',
        extended: true,
        get: stack => stack && stack.name
      },
      {
        key: 'region',
        extended: true,
        get: region => region && region.name
      },
      {
        key: 'organization',
        extended: true,
        get: organization => organization && organization.name
      },
      {
        key: 'team',
        extended: true,
        get: team => team && team.name
      },
      {
        key: 'stack',
        extended: true,
        get: stack => stack && stack.name
      },
    ])
  }
}
