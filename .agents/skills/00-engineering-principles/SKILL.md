---
name: engineering-principles
description: Universal engineering standards, logic frameworks, and technical excellence guidelines applicable to any software project.
---

# 📜 Engineering Principles (Universal OS)

This is the non-negotiable Technical Constitution of the system. Every architect and engineer must align their decisions with these principles, regardless of the product type.

---

## 1. Logic Over Syntax (Mantık Kodun Önündedir)
- **Problem First, Code Second:** Never write a line of code before the logic is fully mapped out.
- **Cognitive Load:** Code should be easy to read and reason about. Complexity is a bug.
- **Predictability:** Given the same input, a function/module should always produce the same, predictable output.

## 2. Structural Integrity (Yapısal Bütünlük)
- **Decoupling:** Every module/component should be independently testable and replaceable.
- **Single Source of Truth:** Data and state should have one clear owner. No duplication of truth.
- **Standardized Interfaces:** Communication between systems must follow strict, well-documented protocols.

## 3. Defense-in-Depth (Derinlemesine Savunma)
- **Zero Trust:** Never trust data coming from outside a function or service. Validate everything (Types & Runtime).
- **Graceful Failure:** Systems must be designed to fail safely. No cascading failures.
- **Auditability:** Every significant state change must be traceable.

## 4. Resource Stewardship (Kaynak Bilinci)
- **Efficiency:** Optimize for CPU, Memory, and Network only where it matters, but never be wasteful.
- **Docker-First:** Consistency across development, staging, and production is mandatory.
- **Portability:** Avoid vendor lock-in. Keep the core logic independent of specific infrastructure providers.

## 5. Maintenance as a Feature (Sürdürülebilirlik)
- **Explicit Naming:** Variable and function names must describe intent, not implementation.
- **Self-Documenting Code:** Code should tell "how", comments should tell "why" (if it's not obvious).
- **Dead Code Elimination:** What isn't used should not exist. Regularly audit with tools like Knip.

---

## 🏗️ Technical Frameworks to Respect

### A. The "Clean" Philosophy
- **SOLID Compliance:** High cohesion and low coupling are required.
- **DRY (Don't Repeat Yourself):** Abstract common logic into reusable layers.
- **KISS (Keep It Simple, Stupid):** Avoid over-engineering. Solve the current problem with a flexible foundation for the future.

### B. Scalability & Performance
- **Asynchronous Thinking:** Use queues and background jobs for non-blocking operations.
- **Caching Strategy:** Cache frequently accessed, slow-changing data.
- **Database Hygiene:** Proper indexing, normalized structures (until proven otherwise), and UUID-based primary keys.

### C. Developer Experience (DX)
- **Standard Tooling:** Use consistent linting, formatting, and type-checking across all projects.
- **Fast Feedback Loops:** Implementation should be easy to test and verify locally.

---

## 🛡️ Implementation Guardrails (Uygulama Bariyerleri)

1. **Strict Typing:** No `any`. Use discriminated unions and generics for type safety.
2. **Layered Validation:** Validate at the Edge (API), the Domain (Business Logic), and the Persistence (DB).
3. **Immutability:** Prefer immutable data structures unless performance requirements dictate otherwise.
4. **Environment Awareness:** Never hardcode secrets or environment-specific values.

---

# 🎯 Final Mission Statement
"Produce software that is so well-structured and logically sound that another engineer could maintain it successfully 5 years later without a single meeting."