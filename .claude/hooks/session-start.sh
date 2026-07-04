#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# npm < 11.11 drops the package-lock.json "libc" field for platform-specific
# optionalDependencies on install (npm/cli#8514), causing spurious lockfile
# diffs relative to Dependabot and CI.
npm install -g npm@^11.11.0

npm install
