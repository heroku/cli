import ts from 'typescript'
import {transformDescribes, transformNode} from './migrations.js'

const {factory} = ts

export const migrateTestFile = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const transformed = transformNode(sourceFile, transformDescribes)

  return transformed
}
