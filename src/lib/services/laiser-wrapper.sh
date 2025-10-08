#!/bin/bash
# Wrapper script to run LAiSER with clean stdout (JSON only)
# All logs redirected to stderr

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$SCRIPT_DIR/../../../venv/bin/python3"

# Redirect all stderr to /dev/null, keep stdout for JSON
exec 2>/dev/null

# Run LAiSER extractor
"$VENV_PYTHON" "$SCRIPT_DIR/laiser-extractor.py" "$@"
