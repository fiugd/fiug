prism = prism || console.info;
const deps = [
  '../shared.styl'
];

(async() => {
  await appendUrls(deps);

  console.info(`
  You are given a list of jobs to be done, where each job is represented by a start time and end time. Two jobs are compatible if they don't overlap. Find the largest subset of compatible jobs.

  For example, given the following jobs (there is no guarantee that jobs will be sorted):

  [[0, 6],
  [1, 4],
  [3, 5],
  [3, 8],
  [4, 7],
  [5, 9],
  [6, 10],
  [8, 11]]

  Return:

  [[1, 4],
  [4, 7],
  [8, 11]]
  `.trim().replace(/  /g, ''))

  /*
  // what I'd really like to do:
  function maxCompat(input){
      const graph = input
          .toGraph(([a, b], [a2, b2]) => b <= a2);
      return graph
          .flatten()
          .max(x => x.length);
  }
  */

  const input = [[0, 6], [1, 4], [3, 5], [3, 8], [4, 7], [5, 9], [6, 10], [8, 11]];

  function maxCompat(input) {
      const intersect = (a1, a2, r) =>
          a1[0] === a2[0] ||
          a1[1] === a2[1] ||
          (a1[0] < a2[1] && a1[0] > a2[0]) ||
          (a1[1] < a2[1] && a1[1] > a2[0]) ||
          (!r && intersect(a2, a1, true));
      const noInt = input.map(x => input.filter(y => !intersect(x, y)));
      const friend = input
          .map(x => noInt
              .map((y, i) => y
                  .some(z => z[0] === x[0] && z[1] === x[1]) ? i : null)
              .filter(q => q !== null)
           );
      return input
          .map((x, i) => ({
              self: x,
              friends: friend[i]
           }))
          .sort((a, b) => b.friends.length - a.friends.length)
          .reduce((all, one) => {
              if (!all.some(x => intersect(x, one.self))) {
                  all.push(one.self);
              }
              return all;
          }, [])
          .sort((a, b) => a[0] - b[0]);
  }

  const exampleGraph = {
    nodes:[
      {id: "[0, 6]", name: "[0, 6]",   radius:60, color: "orange"},
      {id: "[1, 4]", name: "[1, 4]",   radius:30, color: "yellow"},
      {id: "[3, 5]", name: "[3, 5]",   radius:20, color: "orange"},
      {id: "[3, 8]", name: "[3, 8]",   radius:50, color: "orange"},
      {id: "[4, 7]", name: "[4, 7]",   radius:30, color: "yellow"},
      {id: "[5, 9]", name: "[5, 9]",   radius:40, color: "grey"},
      {id: "[6, 10]", name: "[6, 10]", radius:40, color: "grey"},
      {id: "[8, 11]", name: "[8, 11]", radius:30, color: "#bb3"}
    ],
    "links":[
      {source: "[0, 6]",target:"[6, 10]", weight:2.0, right: true },
      {source: "[0, 6]",target:"[8, 11]", weight:1.8, right: true },

      {source: "[1, 4]",target:"[4, 7]", weight:1.2, right: true},
      {source: "[1, 4]",target:"[5, 9]", weight:1.4, right: true},
      {source: "[1, 4]",target:"[6, 10]", weight:1.4, right: true},
      {source: "[1, 4]",target:"[8, 11]", weight:1.4, right: true},

      {source: "[3, 5]",target:"[5, 9]", weight:1.2, right: true},
      {source: "[3, 5]",target:"[6, 10]", weight:1.2, right: true},
      {source: "[3, 5]",target:"[8, 11]", weight:1.0, right: true},

      {source: "[3, 8]",target:"[8, 11]", weight:1.6, right: true},

      {source:"[4, 7]",target:"[8, 11]", weight:1.2, right: true}
    ]
  };


  const graph = await createGraph(exampleGraph);
  prism('javascript', maxCompat.toString())

  console.info(`INPUT:\n\t[  [${input.join('],  [')}]  ]`);
  console.info('ANSWER:\n\t[  [' + maxCompat(input).join('],  [') + ']  ]');
})();

