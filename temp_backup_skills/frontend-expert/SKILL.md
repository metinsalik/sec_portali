---
name: frontend-expert
description: Expert rules for React, Vite, and Shadcn/UI development. Use for UI implementation, styling, and state management.
---

# Frontend Expert

## Architecture
- **Feature-based:** Group components by feature in `src/components/[feature]`.
- **State:** Use `tanstack-query` for data fetching. Never use `useEffect` for API calls.
- **Styling:** Use Tailwind CSS + `shadcn/ui`. Use `cn()` for class merging.

## Performance
- Use `memo`, `useCallback`, and `useMemo` only when profiling shows benefit.
- Implement lazy loading for routes.

## UI/UX Standards
- **Minimalism:** Use whitespace. Avoid clutter.
- **Colors:** Never use pure black. Use `slate-900` or `zinc-900`.
- **Typography:** `tracking-tight` for headings, `leading-relaxed` for body.
- **Accessibility:** Ensure ARIA labels and keyboard navigation.