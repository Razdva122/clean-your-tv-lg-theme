# Contributing

Use Node.js 22+. Run `npm ci --ignore-scripts` and `npm test`. No npm lifecycle
scripts or author scripts are needed. Keep the launcher, compiler and policy in
the main project; this repository owns only their small trusted wrapper and docs.

Runtime upgrades require reviewed exact main-project provenance and a lock update.
Do not point runtime tooling at floating branches or theme-author repositories.
Candidate exports must stay explicitly marked candidate. Never invent release
URLs/hashes or claim hardware acceptance from a browser preview.

Do not publish TV addresses, credentials, inventories or raw diagnostics. Theme
showcase PRs belong in the main project, targeting release/next. Each theme needs
its own license/credits, identity/version and descriptor digest.
