---
name: knip-core
description: Core rules for Knip development. Use for style, domain knowledge, and general logic.
---

# Knip Core Development

## Coding Style
- Performance is priority. Avoid unnecessary complexity and nesting.
- No comments unless specifically asked.
- Avoid `any` and type casting in TS.
- Use `for..of` instead of `map/reduce` for performance.

## Domain Knowledge
- Unused files lead to unused exports/deps; it's a chain.
- If modifying plugins, refer to `PLUGINS.md`.