import ts from 'typescript'
import {transformDescribesContextsAndIts, transformNode} from './migrations.js'

const {factory} = ts

export const migrateTestFile = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const transformed = transformNode(sourceFile, transformDescribesContextsAndIts)

  return transformed
}
