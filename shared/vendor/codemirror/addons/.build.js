const UglifyJS = require("uglify-js");
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

var scriptName = path.basename(__filename);
const bundleName = '../addon.bundle.js';
const priority = [
  'doc-state.js',

  'codemirror-scrollpastend.js',
  'codemirror-search.js',
  'codemirror-show-invisibles.js',

  'foldcode.js',
  'foldgutter.js',
  'brace-fold.js',
  'xml-fold.js',
  'indent-fold.js',
  'markdown-fold.js',
  'comment-fold.js',

  'panel.js',
];
const ignore = [
  scriptName,
  '_fold.bundle.js',
];
const exclude = (file) => file.includes('.json') ||
  file.includes('node_modules') ||
  ignore.includes(file) ||
  priority.includes(file);

(async() => {
  const files = [
    ...priority,
    ...(await readdir('./')).filter(x => !exclude(x))
  ];
  let allText = `/*
    Codemirror Addon Bundle
    ${new Date().toLocaleString('en')}\n
    ADDONS: ${files.map(x=>x.replace('.js','')).join(', ')}
    */`.replace(new RegExp('    ','g'), '')
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const code = await readFile(file, 'utf8');
    var options = {
      warnings: true
    };
    var result = UglifyJS.minify({code}, options);
    allText += `\n\n\n\n\n
      // -----  ${file}
      ${result.error ? code : result.code}
      `.replace(new RegExp('      ','g'), '');
  }
  await writeFile(bundleName, allText)
})();
