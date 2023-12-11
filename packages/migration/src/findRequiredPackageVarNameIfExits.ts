import ts from 'typescript'

export const findRequiredPackageVarNameIfExits = (sourceFile: ts.SourceFile, packageName: string) => {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }

    for (const decl of statement.declarationList.declarations) {
      const isRequired = ts.isCallExpression(decl.initializer) &&
        decl.initializer.arguments.some(arg => (
          ts.isStringLiteral(arg) && arg.text === packageName
        ))

      if (isRequired) {
        if (ts.isIdentifier(decl.name)) {
          return decl.name.escapedText.toString()
        }

        throw new Error(`findRequiredPackageVarNameIfExits(${packageName}): require in unexpected format`)
      }
    }
  }
}

