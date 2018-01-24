@echo off

set HEROKU_CLI_BINPATH=%~dp0\heroku.cmd

if "%1" == "reset" (
  echo "Removing CLI data files and all plugins..."
  rd /s /q "%LOCALAPPDATA%\heroku"
  exit /b
)

if exist "%LOCALAPPDATA%\heroku\client\bin\heroku.cmd" (
  "%LOCALAPPDATA%\heroku\client\bin\heroku.cmd" %*
) else (
  "%~dp0\..\client\bin\node.exe" "%~dp0\..\client\bin\heroku.js" %*
)
