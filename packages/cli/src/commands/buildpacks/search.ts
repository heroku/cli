import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {BuildpackBody, BuildpackRegistry, Category} from '@heroku/buildpack-registry'

export default class Search extends Command {
  static description = 'search for buildpacks'

  static flags = {
    namespace: Flags.string({description: 'buildpack namespaces to filter on using a comma separated list'}),
    name: Flags.string({description: 'buildpack names to filter on using a comma separated list '}),
    description: Flags.string({description: 'buildpack description to filter on'}),
  }

  static args = [
    {
      name: 'term',
      description: 'search term that searches across name, namespace, and description',
    },
  ]

  async run() {
    const {args, flags} = await this.parse(Search)
    let searchResults: BuildpackBody[]
    const registry = new BuildpackRegistry()

    if (args.term) {
      const uniqueBuildpacks = new Map<string, BuildpackBody>()
      const array = ((await registry.search(args.term)).unwrapOr([]))
        .concat((await registry.search(undefined, args.term)).unwrapOr([]))
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
      buildpack: string;
      category: Category;
      description: string;
    }
    const buildpacks: TableRow[] = searchResults.map((buildpack: BuildpackBody) => {
      return {
        buildpack: `${buildpack.namespace}/${buildpack.name}`,
        category: buildpack.category,
        description: buildpack.description,
      }
    })
    const displayTable = (buildpacks: TableRow[]) => {
      ux.table(buildpacks, {
        buildpack: {
          header: 'Buildpack',
        },
        category: {
          header: 'Category',
        },
        description: {
          header: 'Description',
        },
      })
    }

    if (buildpacks.length === 0) {
      ux.log('No buildpacks found')
    } else if (buildpacks.length === 1) {
      displayTable(buildpacks)
      ux.log('\n1 buildpack found')
    } else {
      displayTable(buildpacks)
      ux.log(`\n${buildpacks.length} buildpacks found`)
    }
  }
}
