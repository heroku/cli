import ts from 'typescript'

export const findRequiredImportVarNameIfExits = (sourceFile: ts.SourceFile, packageName: string) => {
  let importName = ''
  // find require and get import name
  sourceFile.statements.forEach(statement => {
    if (ts.isVariableStatement(statement)) {
      statement.declarationList.declarations.some(decl => {
        const isRequired = ts.isCallExpression(decl.initializer) &&
          decl.initializer.arguments.some(arg => (
            ts.isStringLiteral(arg) && arg.text === packageName
          ))

        if (isRequired) {
          if (ts.isIdentifier(decl.name)) {
            importName = decl.name.escapedText.toString()
          } else {
            throw new Error(`findRequiredImportVarNameIfExits(${packageName}): require in unexpected format`)
          }
        }

        return isRequired
      })
    }
  })

  return importName
}
