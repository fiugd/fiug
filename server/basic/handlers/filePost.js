const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const { promisify } = require('util');

const createFolder = promisify((path, callback) => mkdirp(path, {}, callback))

const file = ({ dialog, win }) =>
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
            const resolvedPath = path.resolve(_path.slice(1));
            const isDirectory = (p) => fs.existsSync(p) && fs.lstatSync(p).isDirectory();
            const fileExists = p => fs.existsSync(p);

            if (lastChar === '/') {
                if(isDirectory(resolvedPath)){
                    res.json({ error: 'folder already exists' });
                    return;
                }
                console.log(`directory create: ${_path}`)
                try{
                    await createFolder(_path);
                    res.json({ message: 'success' })
                } catch(error){
                    res.json({ error });
                }
                return;
            }

            const fileName = _path.slice(1).split('/').pop();
            const parentDir = _path.slice(1).replace(new RegExp(fileName + '$'), '');
            if(!fileExists(parentDir)){
                await mkdirp(parentDir);
            }

            const writeStream = fs.createWriteStream(resolvedPath);
            req.pipe(writeStream);
            req.on('end', function () {
                res.json({ success: true });
            });
            writeStream.on('error', function (err) {
                //TODO: does request end when this happens?
                // how does the writestream error get sent to client?
                console.log(err);
            });

        } catch(error){
            console.log('error occured');
            console.log(error);
            res.json({ error });
        }
    };

module.exports = file;
