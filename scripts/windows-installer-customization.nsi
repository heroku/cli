; Windows installer customization for Heroku CLI.
; Injected by oclif pack:win before Section blocks.
;
; Adds RemoveFromPath to the uninstaller so that $INSTDIR\bin is
; removed from the user's PATH when the CLI is uninstalled.
; The main Uninstall section (from oclif's template) handles file/dir
; removal; this hook removes the PATH entry after it completes.

; un.StrStr — find first occurrence of needle in haystack.
; Push haystack then needle, Call un.StrStr, Pop result ("" if not found).
Function un.StrStr
  Exch $R1  ; needle
  Exch
  Exch $R2  ; haystack
  Push $R3
  Push $R4
  Push $R5
  StrLen $R3 $R1
  StrCpy $R4 0
  loop:
    StrCpy $R5 $R2 $R3 $R4
    StrCmp $R5 $R1 found
    StrCmp $R5 "" notfound
    IntOp $R4 $R4 + 1
    Goto loop
  found:
    StrCpy $R1 $R2 "" $R4
    Goto done
  notfound:
    StrCpy $R1 ""
  done:
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Exch $R1
FunctionEnd

; un.RemoveFromPath — removes a single directory from HKCU PATH.
; Push the directory to remove, then Call un.RemoveFromPath.
Function un.RemoveFromPath
  Exch $0   ; $0 = directory to remove
  Push $1   ; $1 = current PATH string
  Push $2   ; $2 = temp / length
  Push $3   ; $3 = registry handle
  Push $4   ; $4 = API return value
  Push $5   ; $5 = search hit / prefix
  Push $6   ; $6 = suffix after the entry

  System::Call "advapi32::RegOpenKey(i 0x80000001, t'Environment', *i.r3) i.r4"
  System::Call "advapi32::RegQueryValueEx(i $3, t'PATH', i 0, i 0, t.r1, *i ${NSIS_MAX_STRLEN} r2) i.r4"
  System::Call "advapi32::RegCloseKey(i $3)"

  IntCmp $4 0 +2
    Goto done   ; read failed — nothing to do

  ; Check whether $0 appears in $1 at all
  Push $1
  Push $0
  Call un.StrStr
  Pop $5          ; $5 = substring from the match onwards, or ""
  StrCmp $5 "" done   ; not present — nothing to remove

  ; Build a new PATH without $0:
  ;   $5 holds everything from the match to end-of-string
  ;   The prefix is $1 with $5 cut from the right
  StrLen $2 $5
  StrLen $4 $1
  IntOp $4 $4 - $2   ; length of prefix (before the match)
  StrCpy $5 $1 $4    ; $5 = prefix
  StrLen $2 $0       ; length of the entry we're removing
  StrCpy $6 $1 "" $4 ; $6 = everything from the match start onwards
  StrCpy $6 $6 "" $2 ; $6 = suffix after the removed entry

  ; Strip a leading semicolon from $6 (if the entry was mid-PATH: "...;entry;...")
  StrCpy $2 $6 1
  StrCmp $2 ";" 0 +2
    StrCpy $6 $6 "" 1

  ; Strip a trailing semicolon from $5 (if the entry was at the end: "...;entry")
  StrLen $2 $5
  IntOp $2 $2 - 1
  StrCmp $2 0 no_trail   ; prefix is empty
    StrCpy $4 $5 1 $2
    StrCmp $4 ";" 0 no_trail
      StrCpy $5 $5 $2  ; trim trailing ";"
  no_trail:

  StrCpy $1 "$5$6"  ; reassemble

  WriteRegExpandStr HKCU "Environment" "PATH" $1
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  DetailPrint "Removed from PATH: $0"

done:
  Pop $6
  Pop $5
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  Pop $0
FunctionEnd

; Called by NSIS after uninstall completes successfully.
; Removes $INSTDIR\bin from the user's PATH.
Function un.onUninstSuccess
  Push "$INSTDIR\bin"
  Call un.RemoveFromPath
FunctionEnd
