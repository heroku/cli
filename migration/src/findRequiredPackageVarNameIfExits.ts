import ts from 'typescript'

export const findRequiredPackageVarNameIfExits = (sourceFile: ts.SourceFile, packageName: string) => {
  let varName = ''
  sourceFile.statements.some(statement => {
    if (!ts.isVariableStatement(statement)) {
      return false
    }

    return statement.declarationList.declarations.some(decl => {
      const isRequired = ts.isCallExpression(decl.initializer) &&
        decl.initializer.arguments.some(arg => (
          ts.isStringLiteral(arg) && arg.text === packageName
        ))

      if (isRequired) {
        if (ts.isIdentifier(decl.name)) {
          varName = decl.name.escapedText.toString()
        } else {
          throw new Error(`findRequiredImportVarNameIfExits(${packageName}): require in unexpected format`)
        }
      }

      return isRequired
    })
  })

  return varName
}
