const initRootService = async ({ stores }) => {
	const {services, files, changes} = stores;
	const service = {
		name: '~',
		id: 0,
		type: 'default',
		tree: { '~': {
			'.git': { config: {} },
			'.profile': {},
			'settings.json': {},
			'welcome.md': {}
		}},
	};
	await services.setItem('0', service);
	await files.setItem("~/.git/config", '\n');
	await files.setItem("~/settings.json", '{}');

	await files.setItem("~/.profile", `
# configure prompt here
# https://phoenixnap.com/kb/change-bash-prompt-linux
# http://bashrcgenerator.com/

# in the future, parse this and use for prompt
` + 
'export PS1="\[\\033[38;5;14m\]\h\[$(tput sgr0)\] \[$(tput sgr0)\]\[\\033[38;5;2m\]\W\[$(tput sgr0)\]\n\\$ \[$(tput sgr0)\]"'
+ `

`.trim() +'\n');

	await files.setItem("~/welcome.md", `
Welcome to fiug!
================

Try out the terminal on the right.

#### configure git:
\`git config --global user.name john\`
\`git config --global user.email johndoe@example.com\`
\`git config --global user.token {your github token}\`

#### clone a repo:
\`git clone crosshj/fiug-welcome\`

#### list all cloned repos:
\`git list\`

#### open/close a repo in editor:
\`git open crosshj/fiug-welcome\`
\`git close\`

#### view names of changed files:
\`git status\`

#### view changes:
\`git diff\`

#### view changes in a specific file:
\`git diff README.md\`

#### create and push a commit to github:
\`git commit -m "message about changes"\`

#### download all templates (for preview):
\`git clone crosshj/fiug-plugins\`

#### preview files:
\`preview\`

#### preview a specific file:
\`preview README.md\`

#### quit preview
1. click preview pane
2. press Control
3. click quit

`.trim() +'\n');

	await changes.setItem(`state-${service.name}-opened`, [
		{ name: 'welcome.md', order: 0 }
	]);

	return service;
};

class RootService {
	constructor(stores){
		this.stores = stores;
		this.init = () => initRootService(this);
	}
}

export { RootService };
