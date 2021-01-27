const fs = require("fs");
const path = require("path");

const getAllFiles = function (dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (['node_modules', '.git'].includes(file)) {
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

const style = `
<style>
    body { font-family: sans-serif; }
    a { min-height: 1.4rem; display: inline-block; }
    @media (prefers-color-scheme: dark) {
        body {
            background-color: #222;
            filter: invert(1) hue-rotate(164deg) saturate(5);
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-corner,
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #888; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
    }
</style>
`;

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
            //console.log({ _path: resolvedPath });

            const isDirectory = (p) => {
                return fs.existsSync(p)
                    && fs.lstatSync(p).isDirectory();
            };

            if (isDirectory(resolvedPath) && lastChar !== '/') {
                res.redirect('/file/' + resolvedPath.replace(/\\/g, '/') + '/');
                return;
            }

            if (!isDirectory(resolvedPath)) {
                res.sendFile(resolvedPath, {dotfiles: 'allow'});
                return;
            }

            let result = fs.readdirSync(resolvedPath);
            result = result
                .map(x => {
                    try {
                        if (isDirectory(path.resolve(_path.slice(1), x))) {
                            return x + '/';
                        }
                    } catch (e) {
                        return undefined;
                    }
                    return x;
                })
                .filter(x => !!x)
                .sort((a, b) => {
                    if (a.slice(-1) === '/' && b.slice(-1) !== '/') return -1;
                    if (a.slice(-1) !== '/' && b.slice(-1) === '/') return 1;
                    return 0;
                });
            const response = [
                '<a href="../">parent</a><br>',
                ...result.map(x => `
                    <div>
                        <a href="./${x}">${x}</a>
                        <button onclick="(async() => {
                            await fetch('./${x}', { method: 'DELETE'});
                            document.location.reload();
                        })()
                        ">delete</button>
                    </div>
                `)
            ].join('<br>\n');

            res.send(style + response);
        } catch(e){
            res.send(e);
        }
    };

module.exports = file;
