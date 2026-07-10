---
name: knip-plugins
description: Specific instructions for creating or modifying Knip plugins. Use when adding support for a new library or tool.
---

# Knip Plugin Development

When working on plugins, you must ensure they are lightweight and follow the established pattern.

## Workflow
1. Read `PLUGINS.md` before starting.
2. Create a fixture at `packages/knip/fixtures/plugins/[plugin-name]`.
3. Use descriptive names in fixtures.
4. If the plugin only needs to check `package.json` or config files, avoid heavy AST parsing.

## Best Practices
- Keep plugins focused on finding entry points and dependencies.
- Use `empty files` in fixtures if you only need to verify import specifiers.
- Always add a test in `packages/knip/test/plugins` that uses the new fixture.