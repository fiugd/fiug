<!-- no-select -->

...

graph file formats suck!

https://gephi.org/users/supported-graph-formats/
http://manual.cytoscape.org/en/stable/Supported_Network_File_Formats.html


SIF seems kinda important
DOT/GV seems kinda important

CYJS - cytoscapejs format
CX - is this even a well-used extension?


https://en.wikipedia.org/wiki/DOT_(graph_description_language)
https://www.graphviz.org/pdf/dotguide.pdf
https://dreampuf.github.io/GraphvizOnline

lots of examples here (click on images for .gv which seems to be .dot)
http://www.graphviz.org/gallery/

- uses a js version of graphviz to map arguments - https://argdown.org/
- markdown as mindmap - https://markmap.js.org/repl/


# d3 seems to use this format (or can easily be made to use):
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


# GML example:
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

# GV example:
[DOT graph format](https://en.wikipedia.org/wiki/DOT_(graph_description_language))
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