import * as crypto from 'crypto'
import * as fs from 'fs'

// TODO: Maybe turn this into a class and instantiate it with Heroku APIClient and move common API calls here
namespace Utils {
  export async function hasValidChecksum(filename: string, checksum: string): Promise<boolean> {
    const hash = crypto.createHash('sha256')
    const input = fs.createReadStream(filename)

    const calculatedChecksum = await new Promise(resolve => {
      input.on('readable', () => {
        const data = input.read()
        if (data) hash.update(data)
        else resolve(`${hash.digest('hex')}`)
      })
    })
    return (calculatedChecksum === checksum)
  }

  export function filesize(n: number): string {
    const [num, suffix] = require('filesize')(n, {output: 'array'})
    return num.toFixed(1) + ` ${suffix}`
  }
}

export default Utils
