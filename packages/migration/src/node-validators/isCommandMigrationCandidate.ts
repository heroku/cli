import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import ts from 'typescript'

export function isCommandMigrationCandidate(sourceFile: ts.SourceFile): boolean {
  // todo: handle run in module.exports case. example: packages/redis-v5/commands/info.js
  return sourceFile.statements.some(stmt => isRunFunctionDecl(stmt))
}
