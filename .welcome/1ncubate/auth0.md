<!-- no-select -->

<!-- wish this would work right now -->
<link rel="stylesheet" href=".../shared.styl/::preview::/">

## Auth0 SPA authorization
  - the goal is to get authorization working from client-only
  - that much works, but IDP API calls still need a backend
  - get new token management from here (TODO: automate this)
  https://manage.auth0.com/dashboard/us/crosshj/apis/5c04a0bd041ec32e95553613/explorer


<button onclick="
  const token = window.prompt('Enter Management Token');
  token && localStorage.setItem('auth0MngToken', token);
">Set Management Token</button>

<button id="login">Log In</button>

<button id="logout" class="hidden">Log 0ut</button>

<pre id="user">user loading...</pre>
<pre id="repos">repos loading...</pre>
<pre id="files">files loading...</pre>

<style>
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-corner,
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #888; }
  ::-webkit-scrollbar-thumb:hover { background: #555; }

  .hidden { display: none; }
  #container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  #user {
    width: 70em;
    max-width: 90vw;
    margin-left: -10px;
  }
  #login, #logout, button {
    background: transparent;
    font-size: 1em;
    color: inherit;
    padding: 10px 20px;
    border: 1px solid;
  }
  #login:hover {
    background: #666;
    color: white;
  }
</style>

<script>
  document.title = "Auth0 SPA Experiment";
  window.auth0=window.auth0 || {};
  const loginButton = document.getElementById('login');
  const logoutButton = document.getElementById('logout');
  const userInfo = document.getElementById('user');
  const reposInfo = document.getElementById('repos');
  const filesInfo = document.getElementById('files');

  var s = document.createElement("script");
  s.type = "text/javascript";
  s.src = "https://cdn.auth0.com/js/auth0-spa-js/1.7/auth0-spa-js.production.js";
  s.onload = auth0AttachedCb;
  document.head.appendChild(s);

  const delay = time => new Promise(r=>setTimeout(r, time));

  async function User(){

    const user = await auth0.getUser();
    if(!user) {
      loginButton.style.display = "block";
      [userInfo, reposInfo, filesInfo]
        .forEach(x => x.classList.add('hidden'));
    }
    if(user){
      /*const token = await auth0.getTokenWithPopup({
        audience: 'https://crosshj.auth0.com/api/v2/',
        scope: 'read:user_idp_tokens'
      });
      console.log({ token });
      */
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
      /*
        var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + manResJson.identities.find(x => x.connection === "dropbox").access_token);
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({"limit":1000,"path":""});

        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow'
        };

        fetch("https://api.dropboxapi.com/2/files/list_folder", requestOptions)
          .then(response => response.text())
          .then(result => console.log(result))
          .catch(error => console.log('error', error));
      */

    }
  }
  async function Repos(){
    await delay(1000);
    reposInfo.innerHTML = '[ repos from backend ]';
  }
  async function Files(){
    await delay(1000);
    filesInfo.innerHTML = '[ files from backend ]';
  }

  function auth0AttachedCb(){
    (async () => {
      loginButton.classList.add('hidden');
      try{
        auth0 = await createAuth0Client({
          domain: 'crosshj.auth0.com',
          client_id: 'LJ3RP61zaDixMQXCYMXAR54ahWHImW3p',
          scope: 'read:user_idp_tokens',
          redirect_uri: `${document.location.origin}/bartok/.welcome/WIP/auth0.md/::preview::/`
        });
        const queryString = window.location.search.replace('?','');
        if(queryString.includes('code=')){
            await auth0.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
            logoutButton.classList.remove('hidden');
        }
        await User();
        await Repos();
        await Files();
      } catch(e){
        console.error(e);
      }

      loginButton
        .addEventListener('click', async (e) => {
          if(!auth0){ return console.log('no auth0 client'); }
          e.preventDefault();
          //await auth0.loginWithPopup();
          await auth0.loginWithRedirect({
            redirect_uri: `${document.location.origin}/bartok/.welcome/WIP/auth0.md/::preview::/`
          });
        });

       logoutButton
        .addEventListener('click', async (e) => {
          if(!auth0){ return console.log('no auth0 client'); }
          e.preventDefault();
          //await auth0.loginWithPopup();
          await auth0.logout({
            returnTo: `${document.location.origin}/bartok/.welcome/WIP/auth0.md/::preview::/`
          });
        });

    })();
  }
</script>