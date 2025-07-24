# Scripts

This folder contains standalone script packages. Each subfolder is an independent Node.js project with its own `package.json` and dependencies.

## Installing Dependencies

When installing dependencies in any script subfolder, **always use:**

```
pnpm i --ignore-workspace
```

This ensures that a local `node_modules` is created in the script directory, and dependencies are not hoisted or linked from the monorepo workspace.

> **Note:** Do **not** use `pnpm i` without `--ignore-workspace` in these folders, as it may not create a local `node_modules` and can cause runtime errors.

## Running Scripts

Each script subfolder may have its own instructions for running or building. See the `README.md` or `package.json` in each subfolder for details.
