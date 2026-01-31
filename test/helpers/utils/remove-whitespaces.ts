import ansis from 'ansis'

const removeAllWhitespace = (str: string): string => ansis.strip(str).replaceAll(/\s+/g, '')

export default removeAllWhitespace
