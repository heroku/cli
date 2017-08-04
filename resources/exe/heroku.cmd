@echo off
set CLI_BINPATH=%~dp0\heroku.cmd
"%~dp0\..\cli\bin\node.exe" "%~dp0\..\cli\bin\heroku.js" %*
