Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Orbit Employee\Documents\AuraSuite\jarvis"
WshShell.Run "node index.js", 0, False
