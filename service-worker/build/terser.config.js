//https://terser.org/docs/api-reference.html

export default function(){
	return {
		format: {
			// comments: 'all',
			comments: 'some',
			beautify: true,
			// max_line_len: 80
		},
		mangle: false,
		//mangle: true,
		//compress: true,
		// sourceMap: {
		// 	filename: "service-worker.js",
		// 	url: "inline"
		// }
	};
}

