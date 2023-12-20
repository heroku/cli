import ts from 'typescript'
import {transformDescribesContextsAndIts} from './migrations.js'
import {transformNode} from './helpers.js'

export const migrateTestFile = (sourceFile: ts.SourceFile, file: string): ts.SourceFile => {
  const commandNameParts = file.split('commands/')[1].split('/')
  const fileName = commandNameParts[commandNameParts.length - 1]
  commandNameParts[commandNameParts.length - 1] = fileName.split('.')[0]
  const commandName = commandNameParts.join(':')

  const transformed = transformNode(sourceFile, (...args) => transformDescribesContextsAndIts(...args, commandName))

  return transformed
}

