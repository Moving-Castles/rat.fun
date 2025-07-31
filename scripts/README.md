# Credential Checking Scripts

This directory contains scripts to prevent accidental commits of credentials and environment files.

## Scripts

### `pre-commit/check-credentials.js`

Checks staged files for credential patterns like:

- `PRIVATE_KEY=`
- `API_KEY=`
- `TOKEN=`
- `SECRET=`
- `PASSWORD=`
- And other project-specific patterns

### `pre-commit/check-env-files.js`

Checks for:

- `.env` files in staged changes
- Untracked `.env` files in working directory
- Hardcoded environment variables in code

## Setup

The scripts are automatically set up via Husky when you run:

```bash
pnpm install
```

This will:

1. Install Husky as a dev dependency
2. Set up git hooks automatically
3. Run credential checks on every commit

## How It Works

### Local Protection (Husky)

- Runs `check-credentials.js` and `check-env-files.js` before each commit
- Only checks staged files (fast)
- Prevents credentials from being committed locally

### Server Protection (GitHub Actions)

- Runs on every push and pull request
- Checks entire repository
- Provides additional safety net

## What It Catches

### Credentials

- Private keys
- API keys
- Access tokens
- Secrets
- Passwords
- Database connection strings

### Environment Files

- `.env` files (except `.env.example` and `.env.test`)
- Hardcoded environment variables in code
- Untracked environment files

## Error Messages

When credentials are found, you'll see:

```
❌ Found credential pattern in src/config.js
   Pattern: API_KEY\s*=

 CREDENTIALS DETECTED!
Please remove any access tokens, private keys, or secrets before committing.
Use environment variables (.env files) instead.
```

## Bypassing (Emergency Only)

If you need to bypass the checks temporarily:

```bash
# Skip hooks for one commit
git commit -m "message" --no-verify

# Or disable temporarily
HUSKY=0 git commit -m "message"
```

## Adding New Patterns

To add new credential patterns, edit the `patterns` array in:

- `scripts/pre-commit/check-credentials.js` for local checks
- `.github/workflows/credential-check.yml` for server checks

## Best Practices

1. **Use environment variables**: `process.env.API_KEY` instead of hardcoded values
2. **Use .env.example**: Create template files for required environment variables
3. **Keep .env files out of git**: Add them to `.gitignore`
4. **Use secrets management**: For production, use proper secrets management systems
