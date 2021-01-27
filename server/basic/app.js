const { readFileSync } = require('fs');
const request = require('request');
const corsProxy = require('@isomorphic-git/cors-proxy/middleware.js');
const url = require('url');

const appHTML = readFileSync('app.html', 'utf8');
const {app, dialog, BrowserWindow, remote } = require('electron');

const server = require('express')();
const port = 3333;

const tree = require('./handlers/tree.js');
const file = require('./handlers/file.js');
const filePost = require('./handlers/filePost.js');
const fileDelete = require('./handlers/fileDelete.js');

(async () => {
  await app.whenReady();

  //next few lines to make sure window pops on top
  const win = new BrowserWindow({ width: 10, height: 10, show: false });
  win.setAlwaysOnTop(true, "floating", 1);
  win.setVisibleOnAllWorkspaces(true);
  //app.dock.hide();

  const options = {}
  const isogitCorsProxy = corsProxy(options);
  server.use((req, res, next) => {
    try {
      return isogitCorsProxy(req, res, next);
    } catch(e){
      console.log('Error in isogit cors proxy');
      next();
    }
  });

  server.set('json spaces', 2);
  server.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,pragma,cache-control');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });

  server.get('/tree', tree({ dialog, win }));

  server.get('/file*', file({ dialog, win }));

  server.post('/file*', filePost({ dialog, win }));

  server.delete('/file*', fileDelete({ dialog, win }));

  server.get('/proxy/*', (req, res) => {
    let _path = (req.params || {})['0'];
    if(!_path.includes('https://')){
      _path = 'https://' + _path;
    }
    const queryString = url.parse(req.url).query
    _path += '?' + queryString;
    console.log(`PROXY: ${_path}`)
    request(_path).pipe(res);
  });

  server.get('/', (req, res) => {
    res.send(appHTML);
  });

  server.listen(port, () => {
    console.log(`File Service at http://localhost:${port}`)
  });

})();
