const TemplateEngine = (() => {
	const NO_PREVIEW = () => {
		return `
		<!DOCTYPE html>
		<html class="dark-enabled">
			<head>
				<meta charset="UTF-8">
			</head>
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
					color: var(--main-theme-text-color);
				}
				body {
					margin: 0px;
					margin-top: 40px;
					height: calc(100vh - 40px);
					overflow: hidden;
					color: var(--main-theme-text-color);
					background: var(--main-theme-color);
					font-family: system-ui, sans-serif;
				}
			</style>
			<link rel="stylesheet" href="/colors.css" />
			<body>
				<div class="no-preview" title="No preview!">⠝⠕ ⠏⠗⠑⠧⠊⠑⠺</div>
			</body>
		</html>
		`.replace(/^		/g, '');
	};

	class TemplateEngine {
		templates = [];

		constructor({ storage }){
			this.storage = storage;
			this.refresh = this.refresh.bind(this);
			this.NO_PREVIEW = NO_PREVIEW();
		}

		add(name, template) {
			const newTemp = {
				name,
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

			if (filename.includes(".htm")) {
				return contents;
			}
			if (!this.templates.length) return false;
			const foundTemplate = this.getTemplate(filename, contents);
			if (!foundTemplate) return;
			return foundTemplate.convert(contents);
		}

		async refresh(){
			const filesStore = this.storage.stores.files;
			const currentTemplateNames = (await filesStore.keys())
				.filter(x => x.includes(`/.templates/`));
			for(var i=0, len=currentTemplateNames.length; i < len; i++){
				const key = currentTemplateNames[i];
				const value = await filesStore.getItem(key);
				const name = key.split("/").pop();
				const existing = this.templates.find((x) => x.name === name);
				if(existing) {
					this.update(name, value);
					continue;
				}
				this.add(name, value);
			}
		}
	}
	return TemplateEngine;
})();

export {
	TemplateEngine
};
