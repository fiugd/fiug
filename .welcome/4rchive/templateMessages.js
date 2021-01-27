/*
when a template is loaded, it asks if there is a parent and says it is done loading
the parent can say yes and give it data which it can use to do whatever it wants
this speaks to the idea of template being used to serve "virtual" data that is provided it by some host

<iframe src="/{service}/.templates/d3-graph.html"></iframe>
(iframe will ask parent for the data)

the alternative:
create untracked file which will be handled by template then
<iframe src="/{service}/untracked?/example.json"></iframe>
*/
const deps = [
  '../shared.styl'
];

(async() => {
  await appendUrls(deps);
  const exampleGraph = {
    nodes: [
      {id: 'foo',   name:"foo",    radius:20,  color: "red",    fx: 340, fy: 60},
      {id: 'bar',   name:"bar",    radius:20,  color: "white",  fx: 300, fy: 180},
      {id: 'baz',   name:"baz",    radius:20,  color: "black",  fx: 400, fy: 250},
      {id: 'blank', name:"ittie",  radius:10,  color: "green",  fx: 540, fy: 180},
      {id: 'big',   name:"biggie", radius:100, color: "yellow", fx: 600, fy: 360},
    ],
    links: [
      {source:'foo',target:'bar',weight:1},
      {source:'bar',target:'baz',weight:1},
    ]
  };
  // ^^^ why can't JSON.stringify output json that looks JUST like this?? [irritating]
  const graph = await createGraph(exampleGraph);
  await prism('json', JSON.stringify(exampleGraph));
})()
