function processExitPlugin({ types: t}){
	return {
		visitor: {
			AwaitExpression(path){
				const selfHooks = t.memberExpression(
					t.identifier('self'),
					t.identifier('hooks')
				);
				const selfHookCount = t.memberExpression(
					selfHooks,
					t.identifier('length')
				);
				const hookBlock = t.blockStatement([
					t.expressionStatement(
						t.assignmentExpression(
							'=',
							t.memberExpression(
								selfHooks,
								selfHookCount,
								true //computed prop
							),
							path.node.argument
						)
					),
					t.returnStatement(
						t.memberExpression(
							selfHooks,
							t.binaryExpression('-',
								selfHookCount,
								t.numericLiteral(1)
							),
							true //computed prop
						)
					)
				])
				path.node.argument = 
					t.callExpression(
						t.arrowFunctionExpression([], hookBlock ),
						[]
					)
				;
			},
			FunctionDeclaration(path){
				if(!path.node.async) return;
				//console.log('found an async function')
			},
		}
	};
}

export default processExitPlugin;
