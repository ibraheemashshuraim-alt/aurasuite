Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Orbit Employee\Documents\AuraSuite\jarvis"
WshShell.Run """C:\Program Files\nodejs\node.exe"" index.js", 0, False
