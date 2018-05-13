import * as Config from '@oclif/config'
import * as _ from 'lodash'

import SubjectCommand, {TableColumn} from '../../subject_command'

const filesize = require('filesize')

export class AppsList extends SubjectCommand {
  static flags = {
    ...SubjectCommand.flags,
  }

  config!: Config.IConfig
  async run() {
    const {body: apps} = await this.heroku.get('/apps')
    let space: TableColumn[] = []
    if (apps.find((a: any) => a.space)) {
      space.push({key: 'space', get: s => s && s.name})
    }
    this.output(apps, 'name', [
      {key: 'name'},
      {
        key: 'buildpack_provided_description',
        get: (_, row) => row.buildpack_provided_description,
        header: 'Description',
        minWidth: 10,
      },
      {
        key: 'owner',
        get: (owner, row) => {
          const team = _.get(row, 'team.name')
          if (owner.email.endsWith('@herokumanager.com') && team) return team
          return owner.email
        }
      },
      ...space,
      {
        key: 'id',
        header: 'ID',
        extended: true,
        minWidth: 10,
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
        header: 'Organization',
        extended: true,
        get: organization => organization && organization.name
      },
      {
        key: 'team',
        header: 'Team',
        extended: true,
        get: team => team && team.name
      },
      {
        key: 'stack',
        header: 'Stack',
        extended: true,
        get: stack => stack && stack.name
      },
      {
        key: 'web_url',
        header: 'Web URL',
        extended: true,
        minWidth: 10,
      },
      {
        key: 'git_url',
        header: 'Git URL',
        extended: true,
        minWidth: 10,
      },
      {
        key: 'acm',
        header: 'ACM',
        extended: true,
      },
      {
        key: 'slug_size',
        extended: true,
        get: filesize,
      },
      {
        key: 'repo_size',
        extended: true,
        get: filesize,
      },
    ])
  }
}
