---
name: cross-platform
description: Ensures every UI and logic decision is compatible with Web (Next.js) and Mobile (Expo/React Native).
---

# 📱 Cross-Platform Engineering

## Goal
Build once, deploy everywhere (Web + Mobile).

## Strategic Rules
- **Shared Types:** All database and API types must live in a `@shared/types` package.
- **Responsive vs. Native:** 
  - Web: Full Sidebar + Data Tables.
  - Mobile: Bottom Tab Bar + List Cards with Swipe actions.
- **Native Components:** When designing UI, ensure the concept works as a "Touch" target (Mobile) and "Click" target (Web).
- **Navigation:** Use `expo-router` for mobile and Next.js App Router for web, but keep the business routes synchronized.

## Implementation Guardrail
Never write a UI component that "only" works on large screens. Always demand a Mobile View strategy.