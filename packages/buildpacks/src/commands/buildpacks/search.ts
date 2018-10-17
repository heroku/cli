import {Command, flags as Flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'
import {truncate} from 'lodash'

import {BuildpackBody, BuildpackRegistry, Category} from '@heroku/buildpack-registry'

export default class Search extends Command {
  static description = 'search for buildpacks'
  static flags = {
    namespace: Flags.string({description: 'buildpack namespaces to filter on using a comma separated list'}),
    name: Flags.string({description: 'buildpack names to filter on using a comma separated list '}),
    description: Flags.string({description: 'buildpack description to filter on'})
  }
  static args = [
    {
      name: 'term',
      description: 'search term that searches across name, namespace, and description'
    }
  ]

  async run() {
    let {args, flags} = this.parse(Search)
    let registry: BuildpackRegistry
    let searchResults: BuildpackBody[]
    registry = new BuildpackRegistry()

    if (args.term) {
      let uniqueBuildpacks = new Map<string, BuildpackBody>()
      let array = ((await registry.search(args.term, undefined, undefined)).unwrapOr([]))
        .concat((await registry.search(undefined, args.term, undefined)).unwrapOr([]))
        .concat((await registry.search(undefined, undefined, args.term)).unwrapOr([]))
      array
        .forEach((element: BuildpackBody) => {
          uniqueBuildpacks.set(`${element.namespace}/${element.name}`, element)
        })

      searchResults = [...uniqueBuildpacks.values()]
    } else {
      searchResults = (await registry.search(flags.namespace, flags.name, flags.description)).unwrapOr([])
    }

    type TableRow = {
      buildpack: string,
      category: Category,
      description: string,
    }
    let buildpacks: TableRow[] = searchResults.map((buildpack: BuildpackBody) => {
      return {
        buildpack: `${buildpack.namespace}/${buildpack.name}`,
        category: buildpack.category,
        description: buildpack.description
      }
    })
    const trunc = (value: string, _: string) => truncate(value, {length: 35, omission: '…'})
    let displayTable = (buildpacks: TableRow[]) => {
      cli.table(buildpacks, {
        columns: [
          {key: 'buildpack', label: 'Buildpack'},
          {key: 'category', label: 'Category'},
          {key: 'description', label: 'Description', format: trunc}
        ]
      })
    }

    if (buildpacks.length === 0) {
      cli.log('No buildpacks found')
    } else if (buildpacks.length === 1) {
      displayTable(buildpacks)
      cli.log('\n1 buildpack found')
    } else {
      displayTable(buildpacks)
      cli.log(`\n${buildpacks.length} buildpacks found`)
    }
  }
}
