function codemirrorModeFromFileType(fileType){
	const conversions = {
		assemblyscript: { name: 'javascript', typescript: true, assemblyscript: true },
		typescript: { name: 'javascript', typescript: true },
		react: 'jsx',
		svg: 'xml',
		html: {
			name: 'htmlmixed',
			tags: {
				style: [["type", /^text\/(x-)?scss$/, "text/x-scss"],
								[null, null, "css"]],
				custom: [[null, null, "customMode"]]
			}
		},
		sass: { name: 'css', mimeType: 'text/x-scss' },
		less: { name: 'css', mimeType: 'text/x-less' },
		image: { name  : 'default' },
		bat: { name: 'default' },
		mjs: { name: 'javascript' },
		json: { name: 'javascript', json: true }
	};
	//console.log({ fileType, conversions: conversions[fileType] });
	return conversions[fileType] || fileType;
}

// https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

export {
	codemirrorModeFromFileType, debounce
};