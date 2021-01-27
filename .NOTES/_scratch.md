<!-- no-select -->

why I keep vscode open
----------------------

- [ ] service worker flow is not merged to main flow
- [X] no search in project / folder

- [ ] awkward integration with file system
- [ ] buggy file management


- [X] doesn't recall scroll position
- [X] doesn't recall code collapse

- [X] can't dev/edit bartok in bartok
- [X] cant CRUD/save a file with service worker
- [X] highlight is weird (themeing and color issues)
- [X] no search in file

2020-10-11 todo
---------------
- [ ] minimap
- [ ] split editor (mutliple editor panes)
- [ ] preview performance issues
- [ ] javascript/modular templates (vs html-only)
- [ ] terminal watch file
- [ ] preview hot reloading
- [ ] dynamic/virtual files (to feed into preview)
- [ ] settings integration with service worker
- [ ] delay loading all services
- [ ] delay loading service on initial load (loading all code-BAD)
- [ ] diff view
- [ ] improved/cleaner service map
- [ ] system services connected to each other
- [ ] service details in service map
- [ ] command palette commands
- [ ] go to line number
- [ ] working directory in terminal prompt
- [ ] connect context menu commands
- [ ] arrange images on single image (use spritemap techniques/code)
- [ ] clean up and connect listeners/triggers
- [ ] hover highlighting expand/collapse indicators
- [ ] themes: font/colors
- [ ] automatic add vendor deps to service manifest (cached offline)
- [ ] package storage (like package.json/node_modules)
- [ ] all terminal commands working well (like unix)
- [ ] git support integrated
- [ ] share project (zip/torrent
- [ ] one template/multiple file extensions supported
- [ ] connect action bar things
- [X] messaging between template and editor
- [X] file search connected
- [X] import css in jsx files
- [X] untracked files (Untitled-1)
- [X] paste image / file
- [X] tabs versus spaces switching

image processing
----------------
- image clustering
	- keep a bunch of pictures as one file
	- disassembling: superpixels in javascript - https://github.com/kyamagu/js-segment-annotator/blob/master/js/image/segmentation/slico.js
	- assembling/packing: https://github.com/mapbox/potpack
	- image segmentation - https://www.youtube.com/watch?v=ZF-3aORwEc0

- images with extra data
	- extra: 3d data, notes, etc
	- https://medium.com/better-programming/hide-data-within-an-image-507f571aab89
	- https://github.com/exif-js/exif-js
	- probably should wait until hex viewer is in place before going really far with this


2020-09-30 shaders webgl
------------------------
- http://webglplayground.net/ - I like the way source is handled here; divided into meaningful sections
- shadertoy
- fragment and vertex shaders - would like to support previews of these

2020-09-19 settings
-------------------
- settings view could be the first example of preview iframe that interacts with rest of the app
- settings should be a json file with .settings extension
- this should not be hidden at first, but may be later
- preview should be html that is loaded in iframe
- iframe should message the external app
- message should be heard by service worker handler and affect app settings
- these settings are used to update settings file (and consequentially, the html file)


2020-09-17 HUGE
---------------
- less tabs, close all tabs
- create/delete file/folder works with provider
- [x] issue with preview, binary file shows in preview instead
- settings tab issue on refresh
- CRUD, connecting service nodes working in service map (decide what it means to connect from code POV)
- [x] switch between tabs and spaces

2020-09-17 LOOSE
----------------
- demo driven development, versus ticket or changelog driven
- delivery versus debt (false dichotomy?)
- *.todo, *.slides, *.graph - all services should come with "native" support for these
	- graphs - https://en.wikipedia.org/wiki/Category:Infographics
- *.settings - treat settings as templated files with a common UI?
- connect git
	- https://github.com/isomorphic-git/isomorphic-git
	- real/beefy FS abstraction layer


2020-08-22 TODO
---------------

- [X] save a file with Bartok Basic Server provider

- [x] project switch

- list of curent providers in settings

- tons of issues
	- [X] tab closing closes tabs that shouldn't close
	- [X] preview doesn't show if project doesn't have templates (global templates)
	- [ ] project loads index.js even if it doesn't exist
	- [X] tabs are not recalled for projects other than welcome project
	- [X] switching between preview and terminal is broken in some cases
	- [X] settings view has tab switching problems
	- [X] preview fails after fresh boot

- preview full screen
	- should hide most UI elements; only show fullscreen controls
	- fullscreen state is wonky

2020-08-16 Note and Musing
==========================
- THIS SUCKS:  I am manually updating files and refreshing all the time

#### distractions | focus | procrastination
- lot's of things suck and need improved
- many things are cool and not big impact but fun to work on
- anxiety about first item and pain relieving effect of second item


### browsersysnc integration
- http://localhost:3222/browser-sync/browser-sync-client.js
- https://www.browsersync.io/docs/options/#option-socket
- https://www.google.com/search?q=browsersync+without+websocket+polling
- https://github.com/BrowserSync/browser-sync/issues/684#resolving_polling_url
- https://github.com/BrowserSync/browser-sync/issues/599#option-to-stop-polling


2020-08-10 Issues & TODO
========================

### problem with deleting a file directly after creating it

### event handler is already finished [SOLVED]
	1. clear: meta store, handler store, module cache
	2. unregister and stop service worker
	3. refresh page
	4. error in console:
		```
			error in console, but all else seems to be fine:
			VM6:916 Uncaught (in promise) DOMException: Failed to execute 'respondWith' on 'FetchEvent': The event handler is already finished.
					at Object.serviceAPIRequestHandler [as handler] (eval at registerModule (http://localhost:3000/bartok/service-worker.js:227:22), <anonymous>:916:15)

				STACK:
				serviceAPIRequestHandler @ VM6:916
				async function (async)
				serviceAPIRequestHandler @ VM6:911
				fetchHandler @ service-worker.js:82
		```



2020-08-01_1829 TODO
====================

	- [IP] trying to get service worker fully fleshed out

	- [1/2] make terminal not rely on callback pattern
		- [X] instead, it should fire an event and only pop that event off pending queue when answer is heard
		- [ ] should have a timeout with this

	- [ ] seperate template listening and DOM updating from terminal code


DEPLOY | VERSION CONTROL
========================
- https://app.diagrams.net/#G18h5403wK012mFwEuMETVVnQiyZmXPJOy



READING/WRITING TO LOCAL FOLDER
===============================

- [X] use node server running in BG
	- have to have another window open << have not found a way around keeping a terminal open
	- requires server dev(?) << use electron
	- https://www.npmjs.com/package/file-browser << not using this

- write chrome extension which allows access to file system
	- page contacts that extension to read/write files
	- communicate with extension - https://medium.com/@AlonNola/communicating-between-webpages-and-chrome-extensions-f32c326bbfd9



REALLY NEED THE FOLLOWING
=========================

As I come to rely on bartok editor more
for notes and code, I need the following.
This is very important because new features
can currupt previously saved data.

- [x] backup and undo after update
- [x] save to filesystem (so git can be source-of-truth)
- [x] some consistency between server and UI storage

2020-07-19_1731 HUGE
====================

recall all things
	- [X] editor tabs (remember open, selected, and scroll position)
	- [X] editor (load last loaded file)
	- [X] preview (load last loaded preview)
	- [X] panes (window width same as previous, recall positions)

connect all context menu items
	- huge list...

create|update|delete for service API in serviceHandler
	- need this before service worker fork can be merged

reset page for ui
	- [X] kill tree cache (sessionStorage)
	- [X] kill all the recalled things (above)
	- [ ] kill service worker cache (or maybe don't use this)
	- [X] kill service worker (which will be reloaded with boot())
	- [X] kill moduleCache (localStorage) (maybe should be sessionStorage)
	- [X] reloadServices true versus false
	- [ ] kill/reload serviceHandler

BUG: loading page shows loading bar multiple times

TIME AS MONEY
=============

- rephrase all tasks in terms of money and/or time
	- started work on Bartok on March 15, 2020
	- hourly pay rate ~=
	- average amount of time per day on bartok ~=

- how much would I pay to use bartok (trick question)?
- how much would you have to pay me to use bartok (trick question)?

2020-07-14_1902 TODO
====================

- [X] ability to close last file
- [X] bypass "let's go" button on repeat usage
- [X] command palette
- [X] default view for no service selected
- [ ] download ZIP
- [ ] edit bartok in bartok
- [X] editor code folding
	- https://codemirror.net/doc/manual.html#addon_foldcode
- [ ] editor collaborative
- [X] fix: closing (and opening?) a folder should not save that folder as selected
- [X] folders open when contained file is selected
- [X] full screen for preview
- [ ] mini map
- [X] preview binary files: image, font, audio, video
- [X] preview uses service worker
- [ ] react template loading spinner
- [X] recall open files
- [X] recall pane sizes
- [X] recall pinned preview
- [ ] recall scroll position per file
- [X] recall selected file
- [X] search in file
- [ ] search in folder
- [ ] share service
- [ ] shared libs should load in offline mode
- [ ] smoother development flow on file change
- [ ] storage usage indicators: memory & file system
- [X] switch indent between tabs and spaces
- [ ] todo export to bartok file system
- [ ] todo groups
- [ ] todo item edit
- [X] todo priority
- [X] todos import
- [ ] upload a folder
- [ ] upload binary files
- [X] export todo's: JSON
- [X] export todo's: markdown
- [X] fix issue with explorer pane resizing
- [X] read bartok ui (now called "fugue") in bartok
- [X] recall open tree folders
- [X] rename file-examples to be more descriptive
- [X] status bar line and column number update
- [X] todo scrolling

Service Worker
==============

chrome://serviceworker-internals/

https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading
https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook
cache - https://hasura.io/blog/strategies-for-service-worker-caching-d66f3c828433/
https://blog.codecentric.de/en/2019/09/service-workers-tricks-traps/

events - https://w3c.github.io/ServiceWorker/#execution-context-events

lifecycle picture - https://www.digitalocean.com/community/tutorials/demystifying-the-service-worker-lifecycle
lifecycle picture - https://hasura.io/blog/strategies-for-service-worker-caching-d66f3c828433/

https://www.oreilly.com/library/view/building-progressive-web/9781491961643/ch04.html#note_sw_controlling_after_load

stream from service worker - https://developers.google.com/web/updates/2016/06/sw-readablestreams

websocket from service worker?


2020-07-01
==========
- bitcoin/blockchain in browser (and why?)
- [x] indent using tabs
- [X] code folding

- inline font: https://www.webucator.com/blog/2016/11/inline-web-font-avoid-fout/

- open a folder from local hard drive
	- https://www.html5rocks.com/en/tutorials/file/filesystem/#toc-dir-reading
	- https://www.html5rocks.com/en/tutorials/file/filesystem-sync/

- webtorrent
	- in a worker: https://github.com/webtorrent/webtorrent/issues/1248
	- see browser-server and aether-torrent from ^^^


- finish tree context menu
- web loading time
- web persistence layer
	- [X] localforage in serviceworker
	- browserFS?
- [ ] share
- [ ] export zip
- [ ] import zip
- [X] images/binary files
- [X] open preview in new window / share
- [ ] web build system / service layer
- [ ] services graph / service selection
- [X] codemirror elegance & bug where editor shows blank
- [X] non editor tabs
- [ ] template creation flow & overall template design
	- allow preview to interact with other bartok web components
- [ ] settings
	- define a backend
	- define a workflow
- [ ] log in (auth with an identity provider)
- [ ] collaboration
	- https://github.com/lesmana/webrtc-without-signaling-server
	- https://github.com/cjb/serverless-webrtc
	- https://peerjs.com/
- [X] read bartok web in bartok web
- [ ] write bartok web in bartok web
- [ ] require an npm package (and use it)
- [ ] open a page that is just the file in editor or preview mode; options editor + preview (or other mashup)

---------------
I want to be able to do little experiments
 - and easily share them
 - and not have to deal with build system
 - and not spin up a server
 - and later grow them

---------------
Examples of little experiments:
	- [ ] broken clock right twice a day
	- [ ] simluate a collection of people as faulty mirrors
	- [ ] architect stage of some project
	- [ ] emulate kubernetes, explore kubernetes pattern
	- [ ] services with central config service pattern
	- [ ] scrape a bunch of sites and do wizardry (data composition & representation)
	- [ ] write a bunch of ideas then visually group and connect them
	- [ ] write a bunch of little modules then visually group and connect them
	- [ ] collect a ton of stuff and have something make me come back to them or recall them
	- [ ] search for unicode icons without leaving text editor
	- [ ] view fonts in editor
	- [ ] view/change/convert colors and color palettes in editor
	- [ ] write web code the way I want to, use files the way I want to
		- ^^^ might be useful to expand on this



AN ATTEMPT AT FOCUS
===================

What is an MVP for Bartok?
	- CRUD services: editor, preview, templates?
	- visualize services & connections: service map
	- monitor services: service map
	- deploy services: ???
	- manage services: scale, scale policy, etc: ???

What are the nice-to-have sink holes?
- complete parity with items shown in MARKETING.md
- going too far with any given item listed in MVP statement
- open-endedness of the platform
- cool things to make release videos look nicer (preview)?

Potential Sinkhole Hard Examples:
- meta
	- how do UI services work? how much of Bartok UI is built with them?
	- can I build bartok with bartok editor?
- editor
	- could spend too much time (too much?) building an editor and putting all the cool things in it
	- perhaps editor should have it's own MVP/sink-hole evaluation
	- parity: does it do all the beloved editor things?
	- completeness: does it do everything right?
	- innovation: does it do cool things that other editors do not do?
- visuals
	- less concern about time waste here because visuals have appeal
	- would like to fully grasp how far is too far
	- there needs to be a basic set of items in service map
	- how they look is not as much important as how they connect
- monitor
	- similar case as with visuals
	- this depends on visuals being in place
	- need to be able to read logs
	- need to be able to view resource usage
- deploy
	- similar case as with visuals
	- is this a distinct item from manage (below)?
	- need to figure out how to do this
	- this depends on screens that have not been built
- manage
	- what does it mean to manage?
		- scale
		- scale policy
	- similar case as with visuals
	- need to figure out how to do this
	- this depends on screens that have not been built

What are currently the biggest "   "win"   " items?
	- [X] service map showing real services
	- [X] file templates (UI services)
	- [X] file preview (htm, svg, react)

	- files need id's for uniqueness <<< HUGE!!!
	- service save in chunks (because some files are huge)

	- [ ] service templates
	- [ ] logs streaming from server
	- [ ] metrics streaming from server
	- [ ] service map showing real stats
	- [X] direct file system based service (to enable next two wins)

	- [ ] UI ran from within bartok ecosystem (soft exploration into first-class services)
	- [ ] server ran from within bartok ecosystem (more serious foray into first-class services)



SORTED
======

FILE CHANGES
------------
 - [X] only keep changed tabs open, reuse previous/unchanged tabs
 - [X] tabs stay open across reload
 - [X] scroll/cursor position remembered
 - [X] allow closing last tab

PACKAGE.JSON / CONFIG
---------------------
 - [X] service should get its name from package.json
 - [ ] package.json should be ideal and not strict?
	 - (comments, unquoted, single quotes, trailing commas, etc)
 - [ ] package.json should be service.json? .bartok.yml ?

TEMPLATES
---------
 - [ ] templates for services? routeHandler, uiTemplate, plainNode, etc
 - [ ] eject templated app? (export)

PREVIEW
-------
 - [X] better release notes recording videos - page of code SUCKS!
 - [X] sidepane shows preview for React Component, HTML, markdown, etc
 - [X] use iframe: https://stackoverflow.com/questions/5050380/set-innerhtml-of-an-iframe
 - [X] links are clickable in editor (NOPE - in preview instead)
 - document renders/previews differently for certain doc types
	 - [X] [.md] - show rendered html and allow to switch
	 - [X] [.svg]
	 - [X] [.jsx] - do react!
	 - [X] [.ipynb] - jupyter notebook
		 - https://github.com/jsvine/notebookjs
		 - https://github.com/finnp/ipynb
	 - [.tp.json] (made up) - sprite editor and mapped preview (texture packer)


UNSORTED
========
- https://gist.cafe/ - run code snippets on your server, embed in web
- how to implement a programming language
	- http://lisperator.net/pltut/
	- http://angg.twu.net/miniforth-article.html - bootstraping a forth in 40 lines of Lua

- bundling in browser
	- http://webpack.github.io/playground/
	- https://github.com/systemjs/systemjs

- inline controls for codemirror - https://github.com/enjalot/Inlet

- [IP] show binary files as HEX
- [x] show preview in side (instead)

- node in the browser (and for that matter, the other language runtimes or emulators)
	https://blog.cloudboost.io/how-to-run-node-js-apps-in-the-browser-3f077f34f8a5

- https://www.x3dom.org/
- http://create3000.de/x_ite/getting-started/#xhtml-dom-integration

- https://docs.stackery.io/docs/quickstart/quickstart-nodejs/
- https://www.serverless.com/
- https://docs.aws.amazon.com/cdk/latest/guide/home.html
- https://d1.awsstatic.com/whitepapers/architecture/AWS-Serverless-Applications-Lens.pdf

- may be useful with all the stringifying - https://github.com/jsbin/jsbin/blob/master/public/js/vendor/stringify.js

- https://react-live.netlify.app/

- https://observablehq.com/
- https://bl.ocks.org/
	- https://bl.ocks.org/mbostock/11357811 - Wilson's algorithm (maze generation)
- http://www.biofabric.org/gallery/pages/SuperQuickBioFabric.html

- diff - http://cemerick.github.io/jsdifflib/demo.html

- https://stackoverflow.com/questions/51549390/how-to-disable-third-party-cookie-for-img-tags

- https://wall.alphacoders.com/search.php?search=fractal

- http://unikernel.org/projects/ - would be cool if services were compiled to unikernels

- [x] import/require/ read files from within preview
	- eg. <img src="someServicePath/file.png" />
	- eg. import { foo } from 'someServicePath/file.mjs'

- import and export services
- backup and restore
- recycle bin / trash can
- backup sqllite file ?

- [x] panes remember position
- [ ] pane splitting (as with a framework that allows open-ended pane manipulation)
- [ ] code diff

- [X] page resize doesn't respect min width for explorer
- [ ] explorer can be hidden more beautifully, will auto-show and dismiss
- [ ] terminal/preview can be hidden
- [X] terminal can take up full screen

- [ ] link files - files which store links and show them in preview

- [ ] mini-map / preview within files

- https://12factor.net/ - obey???

- inspiration
	- https://github.com/hundredrabbits/Orca
	- https://jspaint.app/
	- https://www.windows93.net/
- not inspiration, but very similar use case
	- https://azure.microsoft.com/en-us/resources/videos/building-web-sites-with-visual-studio-online-monaco/
- mvc/architectural/BS stuff:
	- https://mvc.givan.se/ -
	- New Jersey vs MIT - https://news.ycombinator.com/item?id=12065570
	- https://en.wikipedia.org/wiki/Worse_is_better


- [ ] remember scroll and cursor positions per file

- [X] command pallete
- [X] find in file dialogs
	- error dialogs / message popups
	- notifications

- keep up with VS CODE: icons, fold/match lines, folder arrows

- [X] code folding & fold all, etc


- keyboard shortcuts:
 - [ ] ctrl-g: go to line
 - [x] ctrl-p: command pallet
 - [ ] https://codemirror.net/demo/sublime.html
 - [ ] https://codemirror.net/doc/manual.html#option_extraKeys

- [ ] draggable tabs (to reorder)
- [ ] draggable files and folders (maybe)


- [ ] popup to indicate certain keyboard shortcuts are pressed


- https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189992/Persistent+Compute+Objects

- https://www.html5rocks.com/en/tutorials/file/filesystem-sync/

- [ ] connect codemirror to a language server
	- http://www.blog.wylie.su/codemirror-lsp
	- code completion, etc

- [ ] stream contents of big files to codemirror (possible?)

- support:
	Rust, Julia, Swift, APL, ML, lisp, C#, OCaml, F#, other??
	https://codemirror.net/mode/index.html
		- apl:
			- https://codemirror.net/mode/apl/index.html
			- http://microapl.com/apl_help/ch_000_030.htm
			- https://www.gnu.org/software/apl/apl.html
			- https://github.com/PlanetAPL/gnu-apl/blob/master/README-3-keyboard

- [ ] color picker in file edit mode

- [ ] make it easy to edit svg's in CSS
- [x] ascii representation of service nodes
	- http://asciiflow.com/ - draw ascii nodes
	- https://github.com/ivanceras/svgbob - convert to svg

- [ ] https://www.dwitter.net/ - 2d graphics in 150 characters

- [ ] spritesheet tool? https://www.leshylabs.com/apps/sstool/

- SVG Editor - https://svg-edit.github.io/svgedit/editor/svg-editor.html
- SVG Optimize - http://petercollingridge.appspot.com/svg-editor
- SVG URL Encoder (for CSS) - https://yoksel.github.io/url-encoder/
- SVG minifier - https://www.svgminify.com/
- SVG loading spinners - https://loading.io/spinner/
- VERY COOL TOOL: https://danmarshall.github.io/google-font-to-svg-path/
- WORKS GREAT WITH: https://svg-edit.github.io/svgedit/editor

- ascii text
- http://patorjk.com/software/taag/#p=testall&f=Graffiti&t=notes

- ascii from pic
- https://www.ascii-art-generator.org/


memory usage and performance
============================

https://auth0.com/blog/four-types-of-leaks-in-your-javascript-code-and-how-to-get-rid-of-them/
https://github.com/paulirish/memory-stats.js/blob/master/memory-stats.js
https://web.dev/monitor-total-page-memory-usage/


fugue: (the UI portion of the bartok ecosystem)
===============================================
components:
- dom: init dom, change/update dom
	- https://micro-frontends.org/ - custom components, etc
- listeners: process event, call some update function that dom has passed
- triggers/actions: user interacting with dom causes system event to be fired
- state?




web assembly
============
- https://www.toptal.com/virtual-reality/assemblyscript-and-webassembly-tutorial
- wasm in-browser
	- https://play.rust-lang.org/
	- https://wasdk.github.io/WasmFiddle/
	- https://webassembly.studio/
- many languages using wasm - https://stackoverflow.com/a/47483989
- many languages wasm - https://github.com/appcypher/awesome-wasm-langs
- https://hacks.mozilla.org/2018/10/webassemblys-post-mvp-future/
- implicit http caching, streaming - https://v8.dev/blog/wasm-code-caching
- https://webassembly.sh/
- https://wapm.io/
- https://wapm.io/package/JeremyLikness/wasi-ubasic
- create a map of wasm tech
	- wasmtime / wasi
	- wasmer - https://github.com/wasmerio/wasmer
	- emscripten
	- https://wiki.nikitavoloboev.xyz/web/webassembly
	- wabt vs binaryen
	- https://github.com/appcypher/awesome-wasm-runtimes - seems very server bound


syntax highlighting, etc
========================

- https://highlightjs.org/static/demo/
- https://highlightjs.org/usage/
- https://ourcodeworld.com/articles/read/309/top-5-best-code-editor-plugins-written-in-javascript

- https://web.mit.edu/alexmv/6.037/sicp.pdf
- http://matt.might.net/articles/best-programming-languages/
- http://www.digibarn.com/collections/posters/tongues/tongues.jpg

- https://github.com/NeekSandhu/codemirror-textmate
	- some day I want a sophisticated system for adding language highlight
	- would like to support highlighting formats from other editors (textmate, others, ???)
	- would like these to load and unload as needed

#### languages
- fibonacci in a lot of languages
	- https://rosettacode.org/wiki/Fibonacci_sequence
	- https://github.com/drujensen/fib
- https://learnworthy.net/top-10-most-popular-language-of-2019-according-to-github/
- https://madnight.github.io/githut/#/pull_requests/2020/2
- reason - https://reasonml.github.io/en/try (COMPILES IN BROWSER!)
- bootstrapping a forth - https://news.ycombinator.com/item?id=24452741

highest paid:
	- Scala
	- [X] Clojure
	- [X] Go
	- [X] Erlang
	- [X] WebAssembly
	- [X] Kotlin
	- [X] Rust,
	- [X] F#
	- [X] Elixir

most popular:
	- [X] Javascript
	- [X] Python
	- [X] Java
	- [X] PHP
	- [X] C#
	- [X] C++
	- [X] TypeScript
	- [ ] Shell
	- [ ] C
	- [X] Ruby

fast growth:
	- [X] Dart         532%
	- [X] Rust         235%
	- [ ] HCL          213% (config)
	- [X] Kotlin       182%
	- [X] TypeScript   161%
	- [ ] PowerShell   154%
	- [ ] Apex         154% (salesforce)
	- [X] Python       151%
	- [ ] Assembly     149%
	- [X] Go           147%

#### web workers
	- this is a pattern I would like to be able to take for granted
	- https://github.com/crosshj/experiments/commit/3a782bfe4e6b2184b5c5fbac204068f24f33aece
	- https://github.com/crosshj/experiments/blob/gh-pages/svg/engine-src/expressionEngine.js#L211
	- https://github.com/crosshj/experiments/blob/gh-pages/rangers.advent/rangers.advent.js#L507
	- https://github.com/crosshj/experiments/blob/gh-pages/encryt-web-worker/index.html#L63

	- paint worklet: https://developers.google.com/web/updates/2018/01/paintapi
	- https://bitsofco.de/web-workers-vs-service-workers-vs-worklets/


webgpu
======

- https://06wj.github.io/WebGPU-Playground/#/Samples/HelloCanvas


visual studio code insiders
===========================

- https://vscode-web-test-playground.azurewebsites.net/?enter=true

animation
=========

- bodymovin / lottie-web - https://codepen.io/collection/nVYWZR/
