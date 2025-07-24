import {Command, flags} from '@heroku-cli/command'
import {spawn as cpSpawn} from 'node:child_process'
import {join} from 'path'
import {fileURLToPath} from 'node:url'

export default class MCPStart extends Command {
  static description = 'starts the Heroku platform MCP server in stdio mode'
  static hidden = true

  static spawn: typeof cpSpawn = cpSpawn

  public async run() {
    const serverPath = join(fileURLToPath(await import.meta.resolve('@heroku/mcp-server')), '../../bin/heroku-mcp-server.mjs')
    const server = MCPStart.spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
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
