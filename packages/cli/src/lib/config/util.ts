import * as tmp from 'tmp'
import * as fs from 'fs-extra'
import {spawn} from 'child_process'

export class Editor {
  async edit(input: string, options = {}) {
    // Create a temporary file
    const tmpFile = tmp.fileSync(options)

    // Write the input to the temporary file
    await fs.writeFile(tmpFile.name, input)

    // Get the editor from environment variables
    const editor = process.env.VISUAL || process.env.EDITOR || 'vim'

    // Spawn the editor process
    const child = spawn(editor, [tmpFile.name], {stdio: 'inherit'})

    // Wait for the editor to close
    await new Promise((resolve, reject) => {
      child.on('exit', code => {
        if (code === 0) resolve(null)
        else reject(new Error(`Editor exited with code ${code}`))
      })
    })

    // Read the edited file
    const result = await fs.readFile(tmpFile.name, 'utf8')

    // Clean up the temporary file
    tmpFile.removeCallback()

    return result
  }
}
