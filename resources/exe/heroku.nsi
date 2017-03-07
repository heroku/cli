!include MUI2.nsh

!define Version 'VERSION'
Name "Heroku CLI"
CRCCheck On
InstallDirRegKey HKCU "Software\Heroku" ""

!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

OutFile "installer.exe"

InstallDir "$PROGRAMFILES64\Heroku"

Section "Heroku CLI ${VERSION}"
  SetOutPath $INSTDIR
  File /r bin
  File /r lib
  WriteRegStr HKCU "Software\Heroku" "" $INSTDIR
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Heroku" \
                   "DisplayName" "Heroku CLI"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Heroku" \
                   "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
SectionEnd

Section "Set PATH to Heroku CLI"
  Push "$INSTDIR\bin"
  Call AddToPath
SectionEnd

Section "Git 2.8.1"
  File "git.exe"
  IfSilent +2
    ExecWait "$INSTDIR\git.exe"

SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"
  RMDir /r "$LOCALAPPDATA\Heroku"
  DeleteRegKey /ifempty HKCU "Software\Heroku"
SectionEnd

!include LogicLib.nsh
!include WinCore.nsh
!ifndef NSIS_CHAR_SIZE
!define NSIS_CHAR_SIZE 1
!endif
Function AddToPath
Pop $R0
Push ${HKEY_CURRENT_USER}
Push "Environment"
Push "Path"
Push ";"
Push $R0
Call RegAppendString
Pop $0
DetailPrint RegAppendString:Error=$0
FunctionEnd

Function RegAppendString
System::Store S
Pop $R0 ; append
Pop $R1 ; separator
Pop $R2 ; reg value
Pop $R3 ; reg path
Pop $R4 ; reg hkey
System::Call 'ADVAPI32::RegCreateKey(i$R4,tR3,*i.r1)i.r0'
${If} $0 = 0
    System::Call 'ADVAPI32::RegQueryValueEx(ir1,tR2,i0,*i.r2,i0,*i0r3)i.r0'
    ${If} $0 <> 0
        StrCpy $2 ${REG_SZ}
        StrCpy $3 0
    ${EndIf}
    StrLen $4 $R0
    StrLen $5 $R1
    IntOp $4 $4 + $5
    IntOp $4 $4 + 1 ; For \0
    !if ${NSIS_CHAR_SIZE} > 1
        IntOp $4 $4 * ${NSIS_CHAR_SIZE}
    !endif
    IntOp $4 $4 + $3
    System::Alloc $4
    System::Call 'ADVAPI32::RegQueryValueEx(ir1,tR2,i0,i0,isr9,*ir4r4)i.r0'
    ${If} $0 = 0
    ${OrIf} $0 = ${ERROR_FILE_NOT_FOUND}
        System::Call 'KERNEL32::lstrlen(t)(ir9)i.r0'
        ${If} $0 <> 0
            System::Call 'KERNEL32::lstrcat(t)(ir9,tR1)'
        ${EndIf}
        System::Call 'KERNEL32::lstrcat(t)(ir9,tR0)'
        System::Call 'KERNEL32::lstrlen(t)(ir9)i.r0'
        IntOp $0 $0 + 1
        !if ${NSIS_CHAR_SIZE} > 1
            IntOp $0 $0 * ${NSIS_CHAR_SIZE}
        !endif
        System::Call 'ADVAPI32::RegSetValueEx(ir1,tR2,i0,ir2,ir9,ir0)i.r0'
    ${EndIf}
    System::Free $9
    System::Call 'ADVAPI32::RegCloseKey(ir1)'
${EndIf}
Push $0
System::Store L
FunctionEnd

Function StrStr
  Exch $R1 ; $R1=substring, stack=[old$R1,string,...]
  Exch     ;                stack=[string,old$R1,...]
  Exch $R2 ; $R2=string,    stack=[old$R2,old$R1,...]
  Push $R3
  Push $R4
  Push $R5
  StrLen $R3 $R1
  StrCpy $R4 0
  ; $R1=substring, $R2=string, $R3=strlen(substring)
  ; $R4=count, $R5=tmp
  loop:
    StrCpy $R5 $R2 $R3 $R4
    StrCmp $R5 $R1 done
    StrCmp $R5 "" done
    IntOp $R4 $R4 + 1
    Goto loop
done:
  StrCpy $R1 $R2 "" $R4
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Exch $R1 ; $R1=old$R1, stack=[result,...]
FunctionEnd
