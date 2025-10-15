' VBScript to launch Electron app silently (no console window)
Set WshShell = CreateObject("WScript.Shell")

' Get the directory where this script is located
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Change to project directory and run npm command
' 0 = Hidden window, True = Wait for completion
WshShell.Run "cmd /c cd /d """ & scriptDir & """ && npm run electron:dev", 0, False

' Exit the script
WScript.Quit
