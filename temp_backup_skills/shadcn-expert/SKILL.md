---
name: shadcn-expert
description: Specialized skill for Shadcn/UI and Tailwind CSS. Use when writing JSX/TSX, styling components, or implementing Shadcn primitives.
---

# Shadcn/UI Expert Implementation

## Component Archetypes
- Always use **Composition** over large prop-drilling components.
- Use `cn()` utility for all conditional class merging.
- Ensure all components are Accessible (ARIA labels, keyboard navigation).

## Tailwind Optimization
- Group classes logically: Layout (flex/grid) -> Sizing -> Spacing -> Colors -> Effects.
- Use `gap` instead of `margin` between elements in flex/grid.
- Prefer `dark:` variants for all color choices to ensure dark mode compatibility.

## Shadcn Specifics
- When installing a new component, check for existing versions in `@/components/ui`.
- Wrap interactive elements in `Suspense` or `Skeleton` states if they depend on data.