Set WshShell = CreateObject("WScript.Shell")

' Kill any existing processes first
WshShell.Run "taskkill /F /IM node.exe /T", 0, True
WshShell.Run "taskkill /F /IM electron.exe /T", 0, True

' Wait a moment
WScript.Sleep 2000

' Change to project directory and start Vite in hidden window
WshShell.CurrentDirectory = "C:\Users\nabil\Projects\Classroom-Management-System"
WshShell.Run "cmd /c npm run dev", 0, False

' Wait for Vite to start (15 seconds)
WScript.Sleep 15000

' Set environment and launch Electron
Set objEnv = WshShell.Environment("Process")
objEnv("NODE_ENV") = "development"

' Launch Electron
WshShell.Run "cmd /c node_modules\.bin\electron.cmd .", 0, False
