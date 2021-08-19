//show-preview
const fetchJSON = async (url, opts) => await(await fetch(url, opts)).json();
const proxy = 'https://api.allorigins.win/post?url=';

/*

the whole point of this is that (easy) databases become a pain point
I am searching for an alternative that is really just API calls and VERY LOW friction

ISSUES:
- client story is not all that great
	- CORS is not handled properly
	- keys to the kingdom API keys vs granular permissions


github as database:
https://github.com/DavidBruant/github-as-a-database
https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/

I HAVE TRIED FROM HERE: https://free-for.dev/#/?id=dbaas
- [X] airtable.com
- [ ] Astra
- [ ] cloudamqp.com
- [ ] elephantsql.com
- [X] FaunaDB - this works, but bleh graphQL and no per-user auth
- [ ] graphenedb.com
- [ ] heroku.com
- [ ] Upstash
- [ ] MongoDB Atlas
- [ ] redsmin.com
- [ ] redislabs
- [ ] MemCachier
- [ ] scalingo.com
- [ ] SeaTable
- [ ] skyvia.com
- [ ] StackBy
- [ ] InfluxDB
- [X] Quickmetrics - CORS issues
- [X] restdb.io - CORS issues

*/


/*
import faunadb from 'https://cdn.skypack.dev/faunadb';

(async () => {

	var q = faunadb.query
	const secret = 'fnAEJdDnBeACBuyrLXjl_v9Hs9CN-XuJRa0rp98X';
	var client = new faunadb.Client({
		secret,
		domain: 'db.fauna.com',
		scheme: 'https',
	})
	const res = await client.query(
		q.Paginate(q.Collections())
	)
	console.log(res)

})();
*/

