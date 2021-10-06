function consolePlugin({ types: t}) {
	return {
		visitor: {
			// Identifier(path) {
			// 	console.log(path.node.name+'\n')
			// 	path.node.name = 'IDENT';
			// },
			CallExpression(path) {
				if(!path.node.callee.property) return;
				//path.node.callee.property && (path.node.callee.property.name = 'CALLEE');
				if(path.node.callee.object.name !== 'console' || path.node.callee.property.name !== 'log') return;

				path.replaceWith(
					t.callExpression(
						t.identifier('processWrite'),
						path.node.arguments
					)
				);
				//path.node.arguments = path.node.arguments.map(x => t.stringLiteral('ARGS'));
			},
			// ExpressionStatement(path){
			// 	path.node.name && (path.node.name = 'EXP');
			// },
			MemberExpression(path){
				// if(t.isAssignmentExpression(path.parent)) return;
				// if(t.isIdentifier(path.node.property)) {
				// 	path.node.property = t.stringLiteral(path.node.property.name);
				// }
				// if(path.node.property.value !== 'log') return;
				// path.replaceWith(t.identifier('mori'));
				// path.replaceWith(
				// 	t.memberExpression(t.identifier('mori'), t.identifier('hashMap'))
				// );
			}
		},
	};
}
export default consolePlugin;
