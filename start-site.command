#!/bin/sh
# Opens the Enigma Studio site from this folder at http://localhost:8080/ (Mac / Linux).
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8080/" 2>/dev/null || xdg-open "http://localhost:8080/" ) &
python3 -m http.server 8080
