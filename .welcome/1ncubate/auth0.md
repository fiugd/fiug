<!-- wish this would work right now -->
<!-- link rel="stylesheet" href="../shared.styl/::preview::/" -->
<style>
	.hidden { display: none !important; }

	::-webkit-scrollbar { width: 5px; height: 5px; }
	::-webkit-scrollbar-corner,
	::-webkit-scrollbar-track { background: transparent; }
	::-webkit-scrollbar-thumb { background: #7773;}

	body .markdown-body pre:hover::-webkit-scrollbar-thumb {
		background: #777;
	}
	body .markdown-body pre {
		word-wrap: unset;
	}

	#container {
		display: flex;
		flex-direction: column;
		align-items: start;
		padding-top: 6em;
		padding-bottom: 0;
		margin-left: -10px;
	}
	#user, #repos, #files {
		width: 100%;
	}
	button {
		background: transparent;
		font-size: 0.75em;
		color: inherit;
		padding: 10px 20px;
		border: 1px solid;
	}
	button:hover {
		background: #666;
		color: white;
	}
	.toolbar-top {
		position: absolute;
		top: 4em;
		right: 0;
		left: 0;
		padding: 0 1.25em;
		display: flex;
		justify-content: space-between;
	}
</style>

<div class="toolbar-top">
	<button id="management-token" onclick="
		const token = window.prompt('Enter Management Token');
		token && localStorage.setItem('auth0MngToken', token);
	">Set Management Token</button>

	<button id="login" class="hidden" onclick="
		event.preventDefault();
		if(!auth0){ return console.log('no auth0 client'); }
		auth0.loginWithPopup()
			.then(() => document.location.reload());
	">Log In</button> 

	<button id="logout" class="hidden" onclick="
		event.preventDefault();
		if(!auth0){ return console.log('no auth0 client'); }
		auth0.logout({
			returnTo: document.location.href
		});
	">Log 0ut</button>
</div>

## Auth0 SPA authorization
- the goal is to get authorization working from client-only
- that much works, but IDP API calls still need a backend (in some cases?) and management token in client is not a good approach

*get new token management from [here](https://manage.auth0.com/dashboard/us/crosshj/apis/5c04a0bd041ec32e95553613/explorer) (TODO: automate this)*

#### ALTERNATIVE: use personal access tokens
[github](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)
[gitlab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
[dropbox](https://dropbox.tech/developers/generate-an-access-token-for-your-own-account)
[bitbucket](https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html)
[digital ocean](https://docs.digitalocean.com/reference/api/api-reference/#section/Introduction/Curl-Examples)


<pre id="user" class="hidden">user loading...</pre>
<pre id="repos" class="hidden">repos loading...</pre>
<pre id="files" class="hidden">files loading...</pre>



<script>
	const auth0Url = "https://cdn.auth0.com/js/auth0-spa-js/1.7/auth0-spa-js.production.js"
	const fetchJSON = (url, opts) => fetch(url, opts).then(x => x.json());
	const appendScript = (url) => new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.crossOrigin = "anonymous";
		script.onload = resolve;
		script.src = url;
		document.head.appendChild(script);
	});
	const delay = time => new Promise(r=>setTimeout(r, time));

	document.title = "Auth0 SPA Experiment";
	const queryString = window.location.search.replace('?','');

	//window.auth0=window.auth0 || {};
	const loginButton = document.getElementById('login');
	const logoutButton = document.getElementById('logout');
	const userInfo = document.getElementById('user');
	const reposInfo = document.getElementById('repos');
	const filesInfo = document.getElementById('files');

	async function User(){
		const user = await auth0.getUser();

		if(!user) {
			loginButton.classList.remove('hidden');
			return;
		}
		userInfo.classList.remove('hidden');
		logoutButton.classList.remove('hidden');

		let token;
		try {
			token = await auth0.getTokenSilently({
				audience: 'https://crosshj.auth0.com/api/v2/',
				scope: 'read:user_idp_tokens'
			});
		} catch(e){}
		try {
			token =	token || await auth0.getTokenWithPopup({
				audience: 'https://crosshj.auth0.com/api/v2/',
				scope: 'read:user_idp_tokens'
			});
		} catch(e){}

		//const claims = await auth0.getIdTokenClaims();
		//console.log({ claims })
		//console.log({ token });

		const manageToken = localStorage.getItem('auth0MngToken');
		if(!manageToken){
			userInfo.innerHTML = JSON.stringify(user, null, 2);
			logoutButton.classList.remove('hidden');

			console.error('managment token is not set; will not attempt to get provider token');
			return;
		}
		const manRes = await fetch(`https://crosshj.auth0.com/api/v2/users/${user.sub}`, {
			headers: {
					'Authorization': 'Bearer ' + manageToken,
					'Content-Type': 'application/json'
			}
		});
		const manResJson = await manRes.json();
		userInfo.innerHTML = JSON.stringify(manResJson, null, 2);
		logoutButton.classList.remove('hidden');

		return manResJson;
	}
	async function Repos(user){
		if(!user){
			reposInfo.innerHTML = '[ repos from backend ]';
			return;
		}
		reposInfo.classList.remove('hidden');
		const { access_token, provider } = user.identities[0];

		const dropbox = async () => {
			const url = "https://api.dropboxapi.com/2/files/list_folder";
			const opts = {
				method: 'POST',
				headers: {
					Authorization: "Bearer " + access_token,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({"limit":1000,"path":""}),
				redirect: 'follow'
			};
			const { entries } = await fetchJSON(url, opts);
			return entries.map(x => x.path_display);
		};

		const github = async () => {
			const headers = ghHeaders(access_token);
			const repos = await fetchJSON(user.repos_url, { headers });
			return repos.map(x=>x.name)
		};

		const operations = { dropbox, github };
		const opResponse = await (operations[provider] || (() => {}))();
		reposInfo.innerHTML = opResponse.join('\n');
	}
	async function Files(){
		await delay(1000);
		filesInfo.innerHTML = '[ files from backend ]';
	}

	//loginButton.classList.add('hidden');
	if(queryString.includes('code=')){
		window.history.replaceState({}, document.title, window.location.pathname);
		logoutButton.classList.remove('hidden');
	}

	const ghHeaders = (auth) => ({
		authorization: `token ${auth}`,
		Accept: "application/vnd.github.v3+json"
	});

	(async () => {
		await appendScript(auth0Url);

		try{
			window.auth0 = await createAuth0Client({
				domain: 'crosshj.auth0.com',
				client_id: 'LJ3RP61zaDixMQXCYMXAR54ahWHImW3p',
				redirect_uri: document.location.href
			});
			const user = await User();
			await Repos(user);
			await Files(user);
		} catch(e){
			console.error(e);
		}

	})()
</script>

