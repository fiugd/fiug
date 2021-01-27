<!-- no-select -->

basic functionality in place
  - hosted node services
  - CRUD for services
  - persistance for services
  
UI is basically like VS Code
  - explorer
  - editor / editor tabs
  - terminal

mult-file support

icons and syntax highlighting for different file types

file templates

preview


----------------------------------------
^^^ DONE ^^^


USE CASE: plain old editor with no backend

USE CASE: editor with preview, useful for front-end dev


UI is fully like VS Code (where expected)
  - CRUD for files (nice context menus, etc)
  - switch between services
  - all things connected:
    - files from backend
    - file status indicator
    - file icons
  - tabs work

authorization for bartok (not for hosted services)

deployed to "PROD" (depends on auth being in place)

USE CASE: basic hosting of backend services
  - swagger-type or routes only service
  - PM2 well-connected
  - scale services

USE CASE: intermediate hosting of client/UI services
  - upload binary files: fonts, images, audio, video
  - connect seemlessly to a backend service

USE CASE: advanced hosting of backend services
  - services map (UI)
  - workers on different machine

