# Project Scope: Fix All Issues & Best Code Analysis

## Goal
Perform a project-wide codebase analysis and fix all foundational blockers (Linting, TypeScript, Security) iteratively, targeting "best code" through pragmatic Modernization.

## Domains & Assignments
- Project Type: WEB (Next.js + Convex)
- Primary Agents to Mock/Invoke Contexts For:
  - `orchestrator`: Overall sequence runner
  - `frontend-specialist`: React components, hooks, UI/UX
  - `backend-specialist`: API, Convex functions, Data
  - `test-engineer`: Testing & validation

## Tasks (Sequenced Execution)
1. **Initial Assessment (Surface Blockers)**
   - Run TypeScript validation (`npx tsc --noEmit`)
   - Run Lint validation (`npm run lint`)
2. **Backend Stabilization**
   - Address Convex schemas, functions, typing issues
3. **Frontend Stabilization**
   - Fix React component typing, hydration errors, unnecessary renders.
   - Refactor key components to match standard best-practices (Iterative Modernization)
4. **Final Audit**
   - Re-run full build to guarantee stability.
