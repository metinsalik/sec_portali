---
name: design-system
description: Handles UI/UX architecture, component mapping, and generates high-fidelity prompts for Google Stitch.
---

# 🎨 Design & Stitch Systems

## Goal
Bridge the gap between business logic and visual implementation.

## Stitch Pipeline
Before writing frontend code, you MUST generate a **Google Stitch Prompt**:
1. **Theme Definition:** Define specific colors (Slate/Zinc), Radius, and Spacing.
2. **Component Mapping:** List each element (Sidebar, Table with Filter, Modern Modal, Stat Cards).
3. **Interaction Specs:** Define hover effects, loading skeletons, and transitions.

## Generate Stitch Prompt
Format the output as a copyable prompt for Stitch:
"Style: Modern Enterprise SaaS. Framework: Shadcn/Tailwind. Page Content: [Details]. Key Features: [Details]. Vibe: Professional, Minimalist."

## Design Review
After the user uploads the Stitch design screenshot:
1. Analyze the layout, spacing, and components.
2. Convert the visual components into real `frontend-expert` code instructions.