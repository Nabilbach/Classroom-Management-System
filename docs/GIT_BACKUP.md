Why this exists

This repository includes an automated backup workflow that creates timestamped backup branches and tags whenever `main` receives a push, and daily via a scheduled run. The goal is to ensure recent work is preserved and recoverable.

Recommended protection steps

- Protect the `main` branch in GitHub settings: require pull requests for changes, require status checks, and require branch protection rules.
- Limit who can push directly to `main`.

How to restore

- To restore from a backup branch: `git fetch origin && git checkout -b restore-branch origin/backup/save-YYYY-MM-DD_HH-MM-SS`
- To restore from a tag: `git fetch --tags origin && git checkout -b restore-<tag> <tag>`

Support

If you want me to enable additional safeguards (like automatic PRs for dangerous changes or a release process), tell me how strict you want the process to be and I'll add CI helpers.