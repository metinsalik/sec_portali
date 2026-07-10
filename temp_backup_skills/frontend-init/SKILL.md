---
name: frontend-init
description: Use when setting up a new project, adding presets, or configuring the frontend architecture and Tailwind configs.
---

# Frontend Initialization & Presets

## Project Setup
- Follow the `shadcn-init-preset` configuration for `globals.css` and `tailwind.config.ts`.
- Ensure standard colors (primary, secondary, accent, destructive) are mapped to CSS variables.
- Set up the standard directory structure:
  - `components/ui` (shadcn)
  - `components/shared` (reusable)
  - `lib/utils.ts` (cn helper)
  - `hooks/` (custom logic)

## Preset Configuration
- Base line-heights, font-sizes, and border-radius must follow the project preset.
- Use `rem` for spacing, never `px`.