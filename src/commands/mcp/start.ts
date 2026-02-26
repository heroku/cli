import {Command} from '@heroku-cli/command'
import {spawn as cpSpawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'path'

export default class MCPStart extends Command {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'starts the Heroku platform MCP server in stdio mode'
  static promptFlagActive = false

  static spawn: typeof cpSpawn = cpSpawn

  public async run() {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const serverPath = join(currentDir, '../../../node_modules/@heroku/mcp-server/bin/heroku-mcp-server.mjs')
    const server = MCPStart.spawn('node', [serverPath], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Pipe all stdio streams
    process.stdin.pipe(server.stdin)
    server.stdout.pipe(process.stdout)
    server.stderr.pipe(process.stderr)

    // Handle process termination
    process.on('SIGINT', () => {
      server.kill('SIGINT')
    })
    process.on('SIGTERM', () => {
      server.kill('SIGTERM')
    })

    return server
  }
}
