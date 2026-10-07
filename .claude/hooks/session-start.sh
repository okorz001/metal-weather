#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Use the Node/npm from .nvmrc (lts/*) to match CI, rather than
# hand-managing npm separately. npm < 11.11 drops the package-lock.json
# "libc" field for platform-specific optionalDependencies on install
# (npm/cli#8514), causing spurious lockfile diffs relative to Dependabot
# and CI; lts/* already bundles a compliant npm.
export NVM_DIR="${NVM_DIR:-/opt/nvm}"
# --no-use skips nvm's auto-activation of .nvmrc on source, which otherwise
# fails (and, under `set -e`, aborts this whole script) on a fresh container
# where no version is installed yet.
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" --no-use

nvm install

# Persist the nvm-selected Node for the session's later commands. Sourcing
# nvm.sh without --no-use auto-activates .nvmrc, matching the version just
# installed above.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export NVM_DIR=\"$NVM_DIR\""
    echo ". \"$NVM_DIR/nvm.sh\""
  } >> "$CLAUDE_ENV_FILE"
fi

npm install
