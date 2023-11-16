import ts from 'typescript';
export function isRunFunctionDecl(node) {
    return ts.isFunctionDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'run';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNSdW5GdW5jdGlvbkRlY2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaXNSdW5GdW5jdGlvbkRlY2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBRTNCLE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFhO0lBQzdDLE9BQU8sRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQTtBQUNqRyxDQUFDIn0=