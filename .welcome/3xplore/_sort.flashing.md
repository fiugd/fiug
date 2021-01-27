<!-- no-select -->

<p class="change">变</p>

Given n number of items alternating between two colors with a different period of change.

- Is it possible to sort these?
- How?
- What is the minimum number of state grabs needed?
- arrange these so cool patterns emerge
  - same colors together for long time
  - alternating colors
  - moving cells or blobs
  - growing blobs
- do the same thing with 2d/3d matrix
- also consider that cycles have a start offset, ie. flashing may not start at same time
- draw waves for cycles and match based on this


### Sorted by period
<div class="container">
  <div class="one"></div>
  <div class="two"></div>
  <div class="three"></div>
  <div class="four"></div>
  <div class="five"></div>
  <div class="six"></div>
  <div class="seven"></div>
  <div class="eight"></div>
  <div class="nine"></div>
  <div class="ten"></div>
</div>


### {name this order}
<div class="container">
  <div class="one"></div>  <!-- 1,2,3,4,5,6,7,8,9,10 -->
  <div class="two"></div>  <!-- 1,2,4,6,8,10 -->
  <div class="four"></div> <!-- 1,2,4,8 -->
  <div class="eight"></div><!-- 1,2,4,8 -->
  <div class="six"></div>  <!-- 1,2,3,6 -->
  <div class="three"></div><!-- 1,3,6,9 -->
  <div class="nine"></div> <!-- 1,3,9 -->
  <div class="ten"></div>  <!-- 1,2,5,10 -->
  <div class="five"></div> <!-- 1,5,10 -->
  <div class="seven"></div><!-- 1,7 -->
</div>



### Shuffled Order

<div class="container">
  <div class="nine"></div>
  <div class="three"></div>
  <div class="five"></div>
  <div class="four"></div>
  <div class="ten"></div>
  <div class="one"></div>
  <div class="eight"></div>
  <div class="six"></div>
  <div class="seven"></div>
  <div class="two"></div>
</div>



<style>
  p.change {
    font-size: 4em;
    margin: auto 0;
    font-family: 'Hiragino Kaku Gothic Pro', 'WenQuanYi Zen Hei', '微軟正黑體', '蘋果儷中黑', Helvetica, Arial, sans-serif;
    display: flex;
    justify-content: center;
    text-shadow: 2px 4px 0px hsl(354, 52%, 37%);
    color: hsla(204, 71%, 54%, 1);
  }
  .container {
    --one-color: #750c31;
    --two-color: #1b6a9e;
    display: flex;
    height: 60px;
    justify-content: space-between;
    background: transparent;
    width: 98%;
    padding: 0 !important;
    list-style: none;
    counter-reset: mycounter;
    border-radius: 3px;
  }
  .container > * {
    background: var(--one-color);
    color: #ddd;

    border-radius: 2px;
    background-image: linear-gradient(
      rgba(0,0,0, .2),
      rgba(0,0,0, 0)
    );
    box-shadow: 0 .1rem .1rem rgba(0, 0, 0, .65),
        inset 0 0.25rem rgba(255, 255, 55, .1);
    flex: 1;
    margin: auto 5px;
    height: 75%;
    counter-increment: mycounter;
    animation-timing-function: steps(1) !important;
    animation-name: color_change !important;
    animation-iteration-count: infinite !important;
  }
  .container > *:before {
    content: counter(mycounter);
    text-align: center;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.25em;
    font-family: sans-serif;
    text-shadow: 2px 2px 5px #56116b;
  }
  .one   { animation-duration: 1s; }
  .two   { animation-duration: 2s; }
  .three { animation-duration: 3s; }
  .four  { animation-duration: 4s; }
  .five  { animation-duration: 5s; }
  .six   { animation-duration: 6s; }
  .seven { animation-duration: 7s; }
  .eight { animation-duration: 8s; }
  .nine  { animation-duration: 9s; }
  .ten   { animation-duration: 10s; }

  @keyframes color_change {
    50% {
      background-color: var(--two-color);
      box-shadow: 0 .1rem .1rem rgba(0, 0, 0, .75),
        inset 0 0.25rem rgba(100, 150, 255, .3);
    }
  }


</style>
