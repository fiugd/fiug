<!-- no-select -->


- files that have same name across tree will show bugs!

- file add -> rename -> delete - issues somewhere in this flow



## DELETE ERROR

1) one at a time, open some files and makes changes and save them
2) create a new file
3) add some text and save
4) with file still open, delete the file using tree menu

file does not get deleted

5) refresh the browser
6) try to delete the file again

file is deleted, but "no file opened" screen shows up in editor and stays that way until another file is selected



## SERVICE SWITCH ERROR

1) open some files
2) switch project

files stay open
should close, also should settings stay open when switching?


## lingering settings

1) open a file
2) make changes
3) open settings
4) close settings

expect: file that is remaining shows its text; settings body disappears

actaul: settings body shows for remaining file instead of file's text