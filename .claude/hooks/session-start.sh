#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Use the Node/npm from .nvmrc (lts/*) to match CI, rather than
# hand-managing npm separately. npm < 11.11 drops the package-lock.json
# "libc" field for platform-specific optionalDependencies on install
# (npm/cli#8514), causing spurious lockfile diffs relative to Dependabot
# and CI; lts/* already bundles a compliant npm.
export NVM_DIR="${NVM_DIR:-/opt/nvm}"
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install

npm install
