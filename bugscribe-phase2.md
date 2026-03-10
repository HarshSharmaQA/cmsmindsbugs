# BugScribe — Phase 2: Enhanced Context & Security

## Goal
Add drawing/annotation capabilities to the widget, secure the backend endpoints with API key validation, and improve console log capture.

## Tasks
- [ ] Task 1: Update `convex/bugs.ts` → Verify: `generateUploadUrl` and `createBug` now require and validate the `apiKey` against the `projectId`.
- [ ] Task 2: Build the Canvas Annotation UI in `public/widget/bugscribe-widget.js` → Verify: Shows a canvas over the screenshot with Pen, Rectangle, and Blur tools.
- [ ] Task 3: Improve console error interception in the widget → Verify: Intercepts unhandled promise rejections and deep errors.
- [ ] Task 4: Add User Identity to widget → Verify: Reporter name/email is passed logically and displayed on the dashboard.

## Done When
- [ ] The widget allows users to draw a red box or blur out parts of the screenshot before submitting.
- [ ] Direct calls to `createBug` fail without a valid API key.
- [ ] The Bug Details view in the dashboard correctly displays the drawn image and the enhanced console logic.
