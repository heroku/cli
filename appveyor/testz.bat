@echo off

%* > tmp.txt
type tmp.txt

if %errorlevel% gtr 0 (
  del tmp.txt
  exit /B %errorlevel%
)

for %%I in (tmp.txt) do set count=%%~zI

if %count% gtr 0 (
  set exitcode=1
) else (
  set exitcode=0
)

del tmp.txt
exit /B %exitcode%
