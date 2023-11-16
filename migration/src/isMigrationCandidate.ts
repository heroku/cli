import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import ts from 'typescript'

export function isMigrationCandidate(sourceFile: ts.SourceFile): boolean {
  return sourceFile.statements.some(stmt => isRunFunctionDecl(stmt))
}
