import ts from 'typescript'
import {transformRootDescribe, transformRuns} from './migrations.js'
import {isTestDescribeOrContextCall} from './validators.js'

const {factory} = ts

export const migrateTestFile = (sourceFile: ts.SourceFile) => {
  let describeFound = false
  const updatedStatements = [...sourceFile.statements]
    .map(statement => {
      if (isTestDescribeOrContextCall(statement)) {
        //   update source file with updated beforeEach, then run on everything else in the block
        describeFound = true
        return transformRootDescribe(statement)
      }

      return statement
    })
    .map(transformRuns)

  if (!describeFound) {
    throw new Error('no describe block found')
  }

  return factory.updateSourceFile(
    sourceFile,
    updatedStatements,
  )
}

