import {ux} from '@oclif/core'

class ErrorExit extends Error {
  code: number | undefined
  constructor(code: number | undefined) {
    super()
    Error.call(this)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name

    this.code = code
  }
}

let mocking: boolean

export function exit(code: number | undefined, message: string | Error) {
  if (message) {
    ux.error(message)
  }

  if (mocking) {
    throw new ErrorExit(code)
  } else {
    process.exit(code)
  }
}

exit.mock = function () {
  mocking = true
}

