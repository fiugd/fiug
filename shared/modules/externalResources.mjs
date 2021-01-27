import { map } from 'https://dev.jspm.io/async-es';
//const { parallel } = asynclib;
//console.log(_a);

let results;
function doneCallback(err, res){
	console.log(`finished with ${res.length} results`);
	console.log(res);
	results = res;
}

var urls = [
	"https://cdn.jsdelivr.net/npm/codemirror@5.49.0/lib/codemirror.js",
	"https://cdn.jsdelivr.net/npm/codemirror@5.49.0/mode/javascript/javascript.js",
	"https://cdn.jsdelivr.net/npm/codemirror@5.49.0/mode/markdown/markdown.js",
	"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js",
	"https://cdnjs.cloudflare.com/ajax/libs/sketch.js/1.0/sketch.min.js"
];

const fetchOne = async (url) => {
	const response = await fetch(url);
	return response.body;
};

// const fetchAll = async () => await Promise.all(
// 	urls.map(fetchOne)
// );

async function fetchAll() {
  const results = await Promise.all(urls.map((url) => fetch(url).then((r) => r.text())));
  return results;
}

export default fetchAll();
