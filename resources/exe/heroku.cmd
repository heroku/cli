@echo off

set CLI_BINPATH=%~dp0\heroku.cmd

if exist "%LOCALAPPDATA%\heroku\client\bin\heroku.cmd" (
  "%LOCALAPPDATA%\heroku\client\bin\heroku.cmd" %*
) else (
  "%~dp0\..\cli\bin\node.exe" "%~dp0\..\cli\bin\heroku.js" %*
)
