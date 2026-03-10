# BugScribe — Phase 4: Email Alerts & Interactive Kanban

## Goal
Enhance user engagement by adding email notifications when a new bug is reported or commented on, and upgrade the dashboard Kanban board to support native drag-and-drop.

## Tasks
- [ ] **Task 1: Email Integration:** Install the `resend` package.
- [ ] **Task 2: Convex Actions:** Create a Convex Action to dispatch an email via Resend whenever a new Bug is inserted (or a comment is added).
- [ ] **Task 3: Drag and Drop Kanban:** Install `@hello-pangea/dnd` for React drag-and-drop support.
- [ ] **Task 4: Dashboard Update:** Refactor `app/dashboard/[projectId]/page.tsx` to wrap the columns in a `<DragDropContext>` and handle the `onDragEnd` event to update the bug status in Convex.

## Done When
- [ ] Moving a bug between Kanban columns is seamless via drag-and-drop.
- [ ] When a bug is submitted by the widget, an email is sent to the project owner's inbox.
