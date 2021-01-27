<!-- no-select -->


"All models are wrong, some models are useful" -- E.P. Box


Most of this document can be considered me obsessing over geometric models I have seen for defining and augmenting thought.  I will try to collect as much of that thought as I can here, but I will also try to take it to a place where it can be connected with "smart" tools like modeling and simulation.


I want to talk about using geometic models as thought aids.  I'll start with a well know example and pose questions after and along the way.



Example: Political Identity Modelling
----------------------------------------

### 1D Model
  <svg viewBox="0 0 100 20">
    <g>
      <line x1=4 x2=96 y1=10 y2=10 />
      <text x=0 y=80% text-anchor="start">left</text>
      <text x=100 y=80% text-anchor="end">right</text>
    </g>
  </svg>


### 2D Model
  <svg
    viewBox="0 0 100 100"
  >
    <g class="layer">
      <title>Layer 1</title>
      <line x1=50 x2=50 y1=10 y2=90 />
      <line x1=10 x2=90 y1=50 y2=50 />
      <text x=50 y=4 text-anchor="middle">authoritarian</text>
      <text x=50 y=98 text-anchor="middle">libetarian</text>
      <text x=4 y=50 class="vertical">left</text>
      <text x=96 y=50 class="vertical">right</text>
    </g>
  </svg>

Thoughts
========
The addition of an extra dimension makes it possible to make a finer point about political identity.  Something is gained; probably more than what is mentioned here.

Some clarity and simplicity is lost in adding this dimension.  Something is lost; probably more than what is mentioned.

- Can we go higher in dimension to gain (and possibly lose) more?

- Can we make it easier to visualize and play with this?
    - it should be as easy as typing or sketching to create the visual
    - should be able to connect model into a modelling and simulation environment (and define that environment)
    - should be easy to increase dimensionality and reason about higher dimensions where visual model may fail


Misc: other models
------------------


### Dungeons and Dragons
  <svg
    viewBox="0 0 100 100"
  >
    <g class="layer">
      <title>Layer 1</title>
      <line x1=50 x2=50 y1=10 y2=90 />
      <line x1=10 x2=90 y1=50 y2=50 />
      <text x=50 y=4 text-anchor="middle">good</text>
      <text x=50 y=98 text-anchor="middle">evil</text>
      <text x=4 y=50 class="vertical">lawful</text>
      <text x=96 y=50 class="vertical">chaotic</text>
    </g>
  </svg>


<style>
  svg {
    --line-color: #7ba098;
    --text-color: #dec19b;
    max-width: 400px;
    display: flex;
    margin: auto;
  }
  line {
    stroke-width: 0.5;
    marker-start: url(#arrow);
    marker-end: url(#arrow);
  }
  line, marker {
    stroke: var(--line-color);
    fill: var(--line-color);
  }
  text {
    fill: var(--text-color);
    font-size: .25em;
    letter-spacing: .05em;
  }
  text.vertical {
    writing-mode: vertical-lr;
    text-orientation: upright;
    text-anchor: middle;
    letter-spacing: 0;
  }
</style>

  <svg style="width:0; height:0">
      <defs>
        <marker
          id="arrow"
          markerHeight="12"
          markerUnits="strokeWidth"
          markerWidth="12"
          orient="auto-start-reverse"
          refX="0"
          refY="3"
          viewBox="0 0 20 20"
        >
          <path d="m0,0l0,6l9,-3l-9,-3z" id="svg_1"/>
        </marker>
      </defs>
  </svg>
