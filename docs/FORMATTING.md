# Formatting Setup

This project uses Prettier for consistent formatting.

## 1. Install the VS Code plugin

Install extension: `esbenp.prettier-vscode`

- Open VS Code
- Go to Extensions
- Search for `Prettier - Code formatter`
- Install

## 2. Enable format on save

This repo includes workspace settings in `.vscode/settings.json`:

- `editor.defaultFormatter = esbenp.prettier-vscode`
- `editor.formatOnSave = true`

If your personal settings override these, enable them in your user settings too.

## 3. Format commands

From project root:

```bash
npm run format
```

Check-only mode (used by CI):

```bash
npm run format:check
```

## 4. CI behavior

CI checks Prettier formatting only for files changed in the current push or pull request.
This prevents legacy formatting differences from blocking unrelated work while still enforcing formatting on new edits.
