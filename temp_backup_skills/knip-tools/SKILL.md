---
name: knip-tools
description: Use when running Knip, debugging exports/dependencies, or using the CLI.
---

# Knip CLI & Debugging

## Running Knip
- Run via `node packages/knip/src/cli.ts` or `bun packages/knip/src/cli.ts`.
- Use `--performance` to profile.
- Use `--debug` for verbose logs.

## Tracing
- To debug unused exports: `knip --trace-export [name] --trace-file [file]`
- To debug dependencies: `knip --trace-dependency [name] --workspace [dir]`