---
name: knip-refactor
description: Guide for refactoring Knip's codebase or using codemods. Use when cleaning up code or performing large-scale edits.
---

# Refactoring Standards

## Tool Selection
- For tiny edits: Manual edit is fine.
- For large-scale changes: Prefer AST-based tools and codemods (e.g., `jscodeshift`) over regex-based searches.

## Procedures
- Prioritize clarity over cleverness.
- Maintain a flat structure; avoid deep nesting in logic.
- Before refactoring the core module graph, you MUST read `MODULE-GRAPH.md`.
- Ensure performance does not regress (use `knip-tools` to profile after refactor).