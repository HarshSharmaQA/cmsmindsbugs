# BugScribe — Phase 1 MVP

## Goal
Bootstrap Next.js 16 + Convex project with schema, core mutations/queries, and the feedback widget.

## Tasks
- [x] Task 1: Create `convex/schema.ts` → Verify: Types compile, Convex dashboard shows tables
- [x] Task 2: Create `convex/bugs.ts` → Verify: `createBug` + `getBugs` + `updateStatus` mutations defined
- [x] Task 3: Create `convex/projects.ts` → Verify: `createProject` + `getProject` queries work
- [x] Task 4: Create feedback widget `public/widget/bugscribe-widget.js` → Verify: html2canvas capture + Convex submit
- [x] Task 5: Build dashboard `app/dashboard/[projectId]/page.tsx` → Verify: Real-time bug list renders
- [x] Task 6: Build project list `app/page.tsx` → Verify: Shows projects, navigate to dashboard
- [x] Task 7: Create `app/layout.tsx` + Convex provider setup → Verify: `npm run dev` loads without errors

## Done When
- [ ] `npm run dev` runs cleanly
- [ ] Widget script can submit a bug (screenshot + metadata) to Convex
- [ ] Dashboard shows bugs in real time from Convex
- [ ] Project switcher on home page works
