:: This batch file checks for network connection problems.
ECHO OFF

:: View network connection details
ipconfig /all

:: Check if geeksforgeeks.com is reachable
ping geeksforgeeks.com

:: Run a traceroute to check the route to geeksforgeeks.com
tracert geeksforgeeks.com
PAUSE
