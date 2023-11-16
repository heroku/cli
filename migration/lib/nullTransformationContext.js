import ts from 'typescript';
export const nullTransformationContext = new Proxy({}, {
    get: (_target, prop) => {
        if (prop === 'factory') {
            return ts.factory;
        }
        return (node) => node;
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbFRyYW5zZm9ybWF0aW9uQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9udWxsVHJhbnNmb3JtYXRpb25Db250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUUzQixNQUFNLENBQUMsTUFBTSx5QkFBeUIsR0FBNkIsSUFBSSxLQUFLLENBQUMsRUFBRSxFQUFFO0lBQy9FLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUNyQixJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDdEIsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFBO1NBQ2xCO1FBRUQsT0FBTyxDQUFDLElBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFBO0lBQ2hDLENBQUM7Q0FDRixDQUE2QixDQUFBIn0=