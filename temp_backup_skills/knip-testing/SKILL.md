---
name: knip-testing
description: Use for running tests and creating test fixtures.
---

# Knip Testing Standards

## Running Tests
- Use `bun test` for speed.
- Test specific files: `bun test test/path/to/file.test.ts`
- Run smoke tests: `pnpm test --runtime bun --smoke`

## Fixture Rules
- Use descriptive names (not "foo").
- Themes (fruits, animals) are preferred to show hierarchy.
- Use empty files where possible to verify import specifiers.