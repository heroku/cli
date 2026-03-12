#!/usr/bin/env node --loader ts-node/esm --disable-warning=ExperimentalWarning

async function main() {
  const {settings} = await import('@oclif/core/settings')
  const {execute} = await import('@oclif/core/execute')

  settings.performanceEnabled = true
  await execute({development: true, dir: import.meta.url})
}

// In dev mode -> use ts-node and dev plugins
process.env.NODE_ENV = 'development'

await main()
