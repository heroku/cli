import {isModuleExports} from './isModuleExports.js'
import {isRunFunctionDecl} from './isRunFunctionDecl.js'
import ts from 'typescript'
export class CommandMigrationFactory {
    program;
    printer;
    nullTransformationContext = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'factory') {
          return ts.factory
        }

        return node => node
      },
    });

    files;
    constructor(files, compilerOptions) {
      this.files = files
      this.program = ts.createProgram({rootNames: files, options: compilerOptions, host: ts.createCompilerHost(compilerOptions)})
      this.printer = ts.createPrinter({newLine: ts.NewLineKind.CarriageReturnLineFeed})
    }

    migrate() {
      this.files.forEach(file => {
        const ast = this.program.getSourceFile(file)
        this.migrateRunFunctionDecl(ast)
        this.migrateModuleExports(ast)
      })
    }

    migrateRunFunctionDecl(node) {
      const visitor = node => {
        if (isRunFunctionDecl(node)) {
          // return createCommandClass()
        }

        return node
      }

      return ts.visitEachChild(node, visitor, this.nullTransformationContext)
    }

    migrateModuleExports(node) {
      const visitor = node => {
        if (isModuleExports(node)) {
          debugger
        }

        return ts.visitEachChild(node, visitor, this.nullTransformationContext)
      }

      return ts.visitEachChild(node, visitor, this.nullTransformationContext)
    }
}
// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzNELE9BQU8sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUU1QixNQUFNLE9BQU8sdUJBQXVCO0lBRWIsT0FBTyxDQUFhO0lBQ3BCLE9BQU8sQ0FBYTtJQUU3Qix5QkFBeUIsR0FBNkIsSUFBSSxLQUFLLENBQUMsRUFBRSxFQUFFO1FBQzFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNsQixJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7Z0JBQ3BCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQzthQUNyQjtZQUNELE9BQU8sQ0FBQyxJQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQTtRQUNsQyxDQUFDO0tBQ0osQ0FBNkIsQ0FBQztJQUVkLEtBQUssQ0FBVztJQUdqQyxZQUFZLEtBQWUsRUFBRSxlQUFtQztRQUM1RCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsRUFBQyxDQUFDLENBQUM7UUFDNUgsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFTSxPQUFPO1FBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxJQUFhO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBYSxFQUFXLEVBQUU7WUFDdkMsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekIsOEJBQThCO2FBQ2pDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVPLG9CQUFvQixDQUFDLElBQWE7UUFDdEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFhLEVBQVcsRUFBRTtZQUN2QyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkIsUUFBUSxDQUFDO2FBQ1o7WUFDRCxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUFBLENBQUM7UUFDN0UsQ0FBQyxDQUFBO1FBQ0QsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDNUUsQ0FBQztDQUNKIn0=
