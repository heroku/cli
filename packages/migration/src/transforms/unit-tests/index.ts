import ts from 'typescript'
import {transformDescribesAndIts, transformNode} from './migrations.js'

const {factory} = ts

export const migrateTestFile = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const transformed = transformNode(sourceFile, transformDescribesAndIts)

  return transformed
}
