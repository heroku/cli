import ts from 'typescript'
import {transformRuns} from './migrations.js'

const {factory} = ts

export const migrateTestFile = (sourceFile: ts.SourceFile) => (
  factory.updateSourceFile(
    sourceFile,
    [...sourceFile.statements].map(transformRuns),
  )
)

