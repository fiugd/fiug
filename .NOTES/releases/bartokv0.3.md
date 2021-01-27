<h1 style="display:none"></h1>
![Release Image]({{PROXY}}/https://i.ytimg.com/vi/LAKMr2ARd34/maxresdefault.jpg)

Summary
=======
  - editor can use local storage
  - file types: icons and syntax highlighting
  - folder operations
  - file changes and status
  - new status bar
  - improved service map
  - [Release Video](https://youtu.be/LAKMr2ARd34)

Some Thoughts
=============
  - how to make video summaries fun
  - keeping track of actions/events and state
  - organizing code (cleaning spaghetti), reacting to previous commitment
  - tree view, panes, arranging 2D visual, service abstraction
  - value | costly work & user(me) privelege/entitlement
  - scope! how big it can be!

Current State
=============
##### meta
  - [X] front end local storage / independent
  - [X] mobile fixed
  - [X] file changes handled gracefully
    - [X] after updating, tabs|editor|tree stays same
    - [X] after updating, status icons go away
    - [X] all unsaved changed handled, not just current file
    - [X] loading spinner/bar/dunno

##### paneView
  - [X] new pane handling based on percentage

##### explorer
  - [X] file icons
  - [X] file change indicators
  - [X] clicking tree item multiple times creates duplicate tabs"
  - [X] package name is in header, not as root folder

##### editor
  - [x] Control-D, Cmd-D for multi-select
  - [X] tabs improvements
    - [X] new tabs are scrolled in to view
    - [X] selected tabs get scrolled in to view
    - [X] file change indicator for tabs (top border)
  - [X] edit other things: other languages, images, etc..
  - [X] active line highlight
  - [X] scroll past end
  - [X] show invisible characters
  - [X] fix sucky scrollbars
    - https://discuss.codemirror.net/t/disabling-scrolling-on-code-mirror-element/2165/4
    - https://codemirror.net/doc/manual.html#option_scrollbarStyle

##### terminal
  - [X] folder
     - [X] add
     - [X] rename
     - [X] move - which rename can do...
     - [X] delete - with all contents
     - [X] read - list children
  - [X] file
     - [X] add file with parent specified
     - [X] delete file with parent
     - [X] move - rename folder can do this without rename file
  - [X] delete command works properly (for project/service)

##### server
  - [X] delete command works properly (for project/service)

##### statusBar
  - [X] NEW!

##### serviceMap
  - [X] pan and zoom
  - [X] data not mocked
  - [X] connections between nodes

