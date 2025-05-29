import stripAnsi from 'strip-ansi'

const removeAllWhitespace = (str: string): string => stripAnsi(str).replace(/\s+/g, '')

export default removeAllWhitespace
