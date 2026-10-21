#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Static UI scaffold only. Preserved backend is deliberately not started.
exec /usr/bin/python3 -m http.server 8787 --bind 127.0.0.1 --directory frontend/dist
