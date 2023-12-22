import ts from 'typescript'
import {transformTest} from './migrations.js'

export const migrateTestFile = (sourceFile: ts.SourceFile): ts.SourceFile => {
  return transformTest(sourceFile)
}

