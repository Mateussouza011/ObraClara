#!/usr/bin/env sh
set -eu

# Run any command using project-local Node.js without exporting PATH manually.
# Examples:
#   ./scripts/use-local-node.sh node -v
#   ./scripts/use-local-node.sh npm --prefix web install
#   ./scripts/use-local-node.sh npm --prefix web run build

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

NODE_DIR=$(find "$PROJECT_ROOT/.local" -maxdepth 1 -type d -name 'node-v*-linux-x64' | head -n 1)
if [ -z "$NODE_DIR" ] || [ ! -x "$NODE_DIR/bin/node" ]; then
  echo "Local Node.js not found in $PROJECT_ROOT/.local"
  echo "Expected folder like: node-v20.19.0-linux-x64"
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: ./scripts/use-local-node.sh <command> [args...]"
  exit 1
fi

export PATH="$NODE_DIR/bin:$PATH"
exec "$@"
