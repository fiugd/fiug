
# graph file formats

Don't ask me why, but humanity seems to find it hard to agree on a notation to represent graphs.  That is, there is no one standard way to represent graph data in textual form, and it can be frustrating trying to find this.

TLDR; choose GML or GOT/GV and use d3/chart.js/cytoscope.js to draw the graph

## misc 
- [gephi](https://gephi.org/users/supported-graph-formats/) - does a decent job of explaining graph formats

- [ArgDown](https://argdown.org/) - uses a js version of graphviz to map arguments, but doesn't expose a graph notation format of its own (?)
- [markmap](https://markmap.js.org/repl/) - markdown as mindmap, seems to use markdown for its graph notation


## graph libraries (web/javascript)
- https://stackoverflow.com/questions/7034/graph-visualization-library-in-javascript
- d3 (plotly uses this)
- chart.js - https://github.com/chartjs/Chart.js (primeNG uses this)
- cytoscape.js
- vis.js


## SIF
stands for Standard Interchange Format

supported by Cytoscope

used by GIS (geographic information system) framework (geospatial data)

Documentation is hard to find.

``` javascript

node1 typeA node2
node2 typeB node3 node4 node5
node0

```

## d3

basically JSON format

```javascript
{
	"nodes":[
		{"name":"node1","group":1},
		{"name":"node2","group":2},
		{"name":"node3","group":2},
		{"name":"node4","group":3}
	],
	"links":[
		{"source":2,"target":1,"weight":1},
		{"source":0,"target":2,"weight":3}
	]
}
```


## GML
stands for Graph Modelling Language

used by Cytoscape, Graphlet, Pajek, yEd, LEDA, NetworkX, and others(?)

see [Graph Modelling Language](https://en.wikipedia.org/wiki/Graph_Modelling_Language)

NOTE: Cytoscape also uses other formats, eg CYJS, CX(?)

- [cytoscape supported](http://manual.cytoscape.org/en/stable/Supported_Network_File_Formats.html)

```javascript

graph [
	comment "This is a sample graph"
	directed 1
	id 42
	label "Hello, I am a graph"
	node [
		id 1
		label "node 1"
		thisIsASampleAttribute 42
	]
	node [
		id 2
		label "node 2"
		thisIsASampleAttribute 43
	]
	node [
		id 3
		label "node 3"
		thisIsASampleAttribute 44
	]
	edge [
		source 1
		target 2
		label "Edge from node 1 to node 2"
	]
	edge [
		source 2
		target 3
		label "Edge from node 2 to node 3"
	]
	edge [
		source 3
		target 1
		label "Edge from node 3 to node 1"
	]
]

```

## GV / DOT
stands for Graph Viz? unsure what DOT stands for

used by Graphviz and others, see [DOT graph format](https://en.wikipedia.org/wiki/DOT_(graph_description_language))

[graphviz DOT guide](https://www.graphviz.org/pdf/dotguide.pdf)
[graphviz online](https://dreampuf.github.io/GraphvizOnline)
[examples](http://www.graphviz.org/gallery/)


```javascript
graph graphname {
    // This attribute applies to the graph itself
    size="1,1";
    // The label attribute can be used to change the label of a node
    a [label="Foo"];
    // Here, the node shape is changed.
    b [shape=box];
    // These edges both have different line properties
    a -- b -- c [color=blue];
    b -- d [style=dotted];
    // [style=invis] hides a node.
  }
```

<script>
  document.title = "Graph Formats";
</script>
