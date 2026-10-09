@echo off
rem Opens the Enigma Studio site from this folder at http://localhost:8080/
rem (the same way it works on hosting, so the YouTube player can play inside the page).
rem Close this window to stop.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-site.ps1"
