import {Command} from '@heroku-cli/command'
import {spawn as cpSpawn} from 'node:child_process'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

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
    const onSigint = () => {
      server.kill('SIGINT')
    }

    const onSigterm = () => {
      server.kill('SIGTERM')
    }

    process.on('SIGINT', onSigint)
    process.on('SIGTERM', onSigterm)

    server.once('exit', () => {
      process.stdin.unpipe(server.stdin)
      process.removeListener('SIGINT', onSigint)
      process.removeListener('SIGTERM', onSigterm)
    })

    return server
  }
}
