import ts from 'typescript';
export function isRequireVarDecl(node) {
    return ts.isVariableDeclarationList(node) &&
        ts.isVariableDeclaration(node.declarations[0]) &&
        ts.isCallExpression(node.declarations[0].initializer) &&
        ts.isIdentifier(node.declarations[0].initializer.expression) &&
        node.declarations[0].initializer.expression.text === 'require';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNSZXF1aXJlVmFyRGVjbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pc1JlcXVpcmVWYXJEZWNsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUUzQixNQUFNLFVBQVUsZ0JBQWdCLENBQUMsSUFBYTtJQUM1QyxPQUFPLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDdkMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQ3JELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO1FBQzVELElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFBO0FBQ3RFLENBQUMifQ==