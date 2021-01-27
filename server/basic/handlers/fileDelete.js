const fs = require("fs");
const { resolve } = require("path");
const rimraf = require("rimraf");
const { promisify } = require('util');

const deleteFile = promisify(fs.unlink); //rimraf may be able to do this
const deleteFolder = promisify((path, callback) => rimraf(path, {}, callback))

module.exports = ({ dialog, win }) =>
    async (req, res) => {
        try {
            const _path = (req.params || {})['0'];
            const lastChar = (_path || '').slice(-1);
            if(!_path){
                res.redirect('/file/');
                return;
            }
            if(_path === '/'){
                res.send(style + 'TODO: browse for a file!');
                return;
            }
            const resolvedPath = resolve(_path.slice(1));
            const isDirectory = (p) => fs.existsSync(p) && fs.lstatSync(p).isDirectory();
            const fileExists = p => fs.existsSync(p);

            console.log({ resolvedPath, isDirectory: isDirectory(resolvedPath), fileExists: fileExists(resolvedPath)})

            if(fileExists(resolvedPath)){
                console.log(`file delete: ${resolvedPath}`)
                await deleteFile(resolvedPath);
            }
            if (isDirectory(resolvedPath) && lastChar !== '/') {
                console.log(`folder delete: ${resolvedPath}`)
                await deleteFolder(resolvedPath);
            }
            res.json({ message: "success" });

        } catch(e){
            console.log('error occured');
            console.log(e);
            res.send(e);
        }
    };
