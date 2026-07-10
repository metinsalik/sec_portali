---
name: modul-development
description: Step-by-step guide for adding new modules to the sec_portali project. Use when creating new features like risks, operations, or panels.
---

# Module Development Workflow

Follow these steps strictly for every new module:

## 1. Database (Prisma)
- Add models to `backend/prisma/schema.prisma`.
- Define relations and foreign keys.
- Run: `npx prisma format`, `npx prisma db push`, `npx prisma generate`.

## 2. Backend (Node/Express)
- Create route file: `backend/src/routes/[modul_adi].ts`.
- Use `express.Router()` and add middleware (`authMiddleware`).
- Register route in `backend/src/index.ts`: `app.use('/api/[modul_adi]', modulRoutes)`.
- If logic is complex, create a service in `backend/src/services/`.

## 3. Frontend (Vite/React)
- **Pages:** Create `frontend/src/pages/[modul_adi]/`. Do NOT put files in root `pages`.
- **Components:** Create `frontend/src/components/[modul_adi]/` for module-specific UI.
- **Routing:** Add routes in `frontend/src/App.tsx` using `<ProtectedRoute>` if needed.
- **Navigation:** Add entry to `PortalPage.tsx` and Sidebar.

## Checklist
- [ ] Prisma schema updated and generated.
- [ ] Backend route created and registered.
- [ ] Frontend pages and components isolated in module folders.
- [ ] Routes added to App.tsx with protection.
- [ ] Navigation updated in Portal/Sidebar.