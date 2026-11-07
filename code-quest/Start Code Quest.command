#!/bin/bash
# Double-click this file (macOS) to start Code Quest and open it in your browser.
# Keep the Terminal window that appears open while you play; close it to stop the game.
cd "$(dirname "$0")" || exit 1
if [ ! -d node_modules ]; then
  echo "First run: installing (1-2 minutes)..."
  npm install || { echo "Install failed - see README Troubleshooting."; read -r -p "Press Enter to close."; exit 1; }
fi
if curl -s -o /dev/null http://localhost:5173/; then
  echo "Code Quest is already running - opening it."
  open http://localhost:5173
  exit 0
fi
(sleep 3; open http://localhost:5173) &
echo "Starting Code Quest... (close this window to stop the game)"
npm run dev
