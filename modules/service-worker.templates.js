(() => {

	const NO_PREVIEW = () => {
		return `
		<!-- NO_PREVIEW -->
		<html>
			<style>
				.no-preview {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 1.5em;
					color: #666;
				}
				body {
					margin: 0px;
					margin-top: 40px;
					height: calc(100vh - 40px);
					overflow: hidden;
					color: #ccc;
					background: #1d1d1d;
					font-family: sans-serif;
				}
			</style>
			<body>
				<pre>
					<div class="no-preview">No preview available.</div>
				</pre>
			</body>
		</html>
		`.replace(/^		/g, '');
	};

	class TemplateEngine {
		templates = [];

		constructor(){
			this.NO_PREVIEW = NO_PREVIEW();
		}

		add(name, template) {
			const newTemp = {
				extensions: [],
				body: template,
				tokens: ["{{template_value}}", "{{markdown}}", "{{template_input}}"],
				matcher: () => false, //TODO: matchers are not currently implemented
			};
			newTemp.extensions.push(name.split(".").shift());
			newTemp.convert = (contents) => {
				let xfrmed = newTemp.body + "";
				newTemp.tokens.forEach((t) => {
					xfrmed = xfrmed.replace(new RegExp(t, "g"), contents);
					//xfrmed = xfrmed.replace(t, contents);
				});
				return xfrmed;
			};
			this.templates.push(newTemp);
		}

		update(name, contents) {
			const ext = name.split(".").shift();
			const matchingTemplates = this.templates.filter((t) =>
				t.extensions.includes(ext)
			);
			matchingTemplates.forEach((m) => (m.body = contents));
			if (!matchingTemplates.length) {
				this.add(name, contents);
			}
		}

		getTemplate(filename = "", contents = "") {
			const ext = filename.split(".").pop();
			const extMatch = this.templates.find((x) => x.extensions.includes(ext));
			if (extMatch) return extMatch;

			// json files can use different templates
			const jsonMatch = (() => {
				if (!filename.includes(".json")) {
					return;
				}
				if (!contents.includes("file-type")) {
					return;
				}
				try {
					const parsed = JSON.parse(contents);
					const fileType = parsed["file-type"];
					if (!fileType) return;
					const _jsonMatch = this.templates.find((x) =>
						x.extensions.includes(fileType)
					);
					return _jsonMatch;
				} catch (e) {
					console.error(e);
					return;
				}
			})();
			return jsonMatch;
		}

		convert(filename, contents) {
			const ext = filename.split(".").pop();
			const isJS = ['js', 'ts', 'mjs', 'jsx', 'tsx'].includes(ext);
			const previewJS = isJS && contents.toLowerCase().includes('//show-preview');
			if(isJS && !previewJS) return;

			if (filename.includes(".htm")) {
				return contents;
			}
			if (!this.templates.length) return false;
			const foundTemplate = this.getTemplate(filename, contents);
			if (!foundTemplate) return;
			return foundTemplate.convert(contents);
		}
	}

	module.exports = {
		TemplateEngine
	};
})();
