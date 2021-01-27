const fs = require("fs");
const path = require("path");

const getAllFiles = function(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
      if(['node_modules', '.git'].includes(file)){
        return;
      }
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    })
    return arrayOfFiles;
};

let root; // previously used root folder
const tree = ({ dialog, win }) => async (req, res) => {
    try {
      let options = {
        buttonLabel : "Select folder",
        properties: ['openDirectory']
      }
      if(root){
        options.defaultPath = root;
      }
      const {
        canceled, filePaths
      } = await dialog.showOpenDialog(win, options);

      if(canceled){
        return res.json({
          error: 'folder pick was canceled',
          root: '',
          files: []
        });
      }

      const selectedPath = filePaths[0];
      const allFiles = getAllFiles(selectedPath);
      root = selectedPath.split('\\').slice(0, -1).join('\\');
      let files = allFiles
        .map(x => x
            .replace(root+'\\', '')
            .replace(new RegExp('\\\\', 'g'), '/')
        );
      root = root.replace(new RegExp('\\\\', 'g'), '/');

      function listToTree(parent, path){
          const split = path.split('/');
          const newPath = split.reverse().pop()
          const remainderPath = path.replace(new RegExp(`^${newPath}/`), '');
          parent[newPath] = parent[newPath] || {};
          if(remainderPath && remainderPath !== newPath){
              listToTree(parent[newPath], remainderPath);
          }
          return parent;
      }
      let tree = files.reduce(listToTree, {});

      const rootTreeItem = Object.keys(tree)[0];
      files = files.map(x => x.replace(rootTreeItem+'/', ''));
      root = root + '/' + rootTreeItem;

      res.json({ root, files, tree });
    } catch(e) {
      res.send(e);
    }
  }

  module.exports = tree;
