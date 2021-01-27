<!-- no-select -->

# reassemble algorithms

# algo 1: (lib/clusterNN.js | swap)
	pick a random block on screen
	determine how fitted it is
		- fitted, move on
		- not fitted, find a better spot for it
	random walk to next place (but don't go back to last n places)

# algo 2:
	take a random block of blocks
	sort all until best fit
	random walk to next block of blocks (but don't go back to last n places)

# algo 3: (lib/cluster.js | processWithBlobs)
	identify blobs (and mark them immune to sorting)
	sort everything else
	repeat
	(result: blocks freeze in place once they are identified as part of blob)


# block fittedness and clustering blocks
- with algorith similar to algo 1, clusters of fitted blocks form and compete
	- fitedness within this cluster is not considered
	- competition between these clusters means that image is not resolved further

- once clusters have formed (when is this?)
	- cluster should have a gravity which pulls consumes
		- other similar clusters
		- most unfitted areas of the image
	- cluster should have some internal process for organizing itself to be better fitted within

# reconstructing from shuffled
- requires "isBetterFit" vs "isFit"
- distribute to multiple cpus
- be smarter about looking for swaps
	- clusters have gravity
	- scan after random
- consider cluster in swap algo
	- cluster here = "large group of connected blocks"
	- consider diagonals when swapping

# when decimating an image
- looks like image compression
- should have minimal decimation
- borders/details don't get swapped
- the block division line causes issues
	- details on edge of block are weird
	- details inside block are weird
	- use other divisions? 
		- hex - https://www.redblobgames.com/grids/hexagons/

# other shapes
- deform the blocks while swapping
- use a hexagon/diamond instead of square

# modularize image manipulation
- abstracting details & properly expose control
- make code more portable (see "distribute to multiple CPUs")

# after a certain period, gave up on swapping occurs more frequently
- requires loosening swap parameters
	- time to swap bailout
	- max blocks to consider bailout
- saving image and restarting sucks

# image border sucks
- when block contains two blobs, it forms a border between those
- this border is hard to match with other blocks and maybe should be treated differently

# using a canvas library to get layers, etc
- http://www.concretejs.com/
- https://html2canvas.hertzen.com/
