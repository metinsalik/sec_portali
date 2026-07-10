---
name: knip-pr
description: Rules for handling bug reports and preparing pull requests. Use when investigating issues or finalizing changes.
---

# Issue & PR Workflow

## Bug Investigation
- **Debug, don't guess.**
- First, confirm the behavior is actually wrong. Is it correct-by-design?
- Reproduce the issue using a local fixture or `stackblitz-zip`.
- Check `EXPORTS.md` if the issue concerns exported identifiers.

## Submission Checklist
- Follow TDD: Update/add tests before implementation.
- Run smoke tests: `pnpm test --runtime node --smoke`.
- Run `pnpm build` to type-check everything.
- Format documentation in `packages/docs` with `pnpm remark`.