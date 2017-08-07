@echo off

set CLI_BINPATH="%~dp0\heroku.cmd"
set CLI_LOCAL_BIN=%LOCALAPPDATA%\heroku\client\bin\heroku.cmd

if exist "%CLI_LOCAL_BIN%" (
  "%CLI_LOCAL_BIN%" %*
) else (
  "%~dp0\..\cli\bin\node.exe" "%~dp0\..\cli\bin\heroku.js" %*
)
