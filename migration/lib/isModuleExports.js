import ts from 'typescript';
/**
 * Determines if the specified node is a 'module.exports = {}' binary expression.
 * This verification also determines if the right hand expression
 * is an object literal.
 *
 * @param node The node to evaluate
 * @returns boolean if the node is a module.exports
 */
export function isModuleExports(node) {
    return ts.isBinaryExpression(node) &&
        ts.isPropertyAccessExpression(node.left) &&
        ts.isIdentifier(node.left.name) &&
        node.left.name.escapedText === 'exports' &&
        ts.isObjectLiteralExpression(node.right) &&
        ts.isIdentifier(node.left.expression) &&
        node.left.expression.escapedText === 'module' &&
        ts.isObjectLiteralExpression(node.right);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNNb2R1bGVFeHBvcnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2lzTW9kdWxlRXhwb3J0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFM0I7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsSUFBYTtJQUMzQyxPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7UUFFNUIsRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDeEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUztRQUN4QyxFQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUV4QyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsS0FBSyxRQUFRO1FBQzdDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDaEQsQ0FBQyJ9