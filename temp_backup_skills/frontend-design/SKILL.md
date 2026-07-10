---
name: frontend-design
description: Expert UI/UX rules for frontend development. Use when designing components, layouts, and choosing styles or animations.
---

# Frontend Design Expert Rules

Follow these high-level principles for every UI task:

## Visual Language
- **Minimalism:** Use whitespace effectively. Avoid clutter.
- **Micro-interactions:** Add subtle animations (0.2s - 0.3s) for hover and state changes.
- **Consistency:** Maintain uniform padding, rounded corners (default to shadcn radius), and font weights.

## UI Best Practices
- Never use pure black (`#000`); use `slate-900` or `zinc-900`.
- Use a maximum of 2-3 logical sections per screen to reduce cognitive load.
- Buttons must have clear focus states and loading indicators where applicable.
- Typography: Use `tracking-tight` for headings and `leading-relaxed` for body text.