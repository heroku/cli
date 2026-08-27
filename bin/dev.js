#!/usr/bin/env node --loader ts-node/esm --disable-warning=ExperimentalWarning

async function main() {
  const {Config} = await import('@oclif/core/config')
  const {settings} = await import('@oclif/core/settings')
  const {execute} = await import('@oclif/core/execute')

  settings.performanceEnabled = true
  const config = await Config.load({root: import.meta.dirname, userPlugins: false})
  const rootPlugin = config.plugins.get(config.name)
  if (rootPlugin) {
    for (const command of Object.values(rootPlugin.manifest.commands)) {
      if (command.relativePath?.[0] !== 'dist') continue
      command.relativePath[0] = 'src'
      command.relativePath[command.relativePath.length - 1] = command.relativePath.at(-1).replace(/\.js$/, '.ts')
    }
  }

  await execute({
    development: true,
    loadOptions: config,
  })
}

// In dev mode -> use ts-node and dev plugins
process.env.NODE_ENV = 'development'

await main()
