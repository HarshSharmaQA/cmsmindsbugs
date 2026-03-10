# BugScribe — Phase 3: User Authentication & Polish

## Goal
Secure the application so that only registered users can create projects and view their dashboards. We will use **Clerk** integrated with Convex for seamless authentication.

## Tasks
- [ ] Task 1: Install `@clerk/nextjs` and configure Next.js middleware to protect the `/` and `/dashboard` routes.
- [ ] Task 2: Update the Convex Client Provider to use `ConvexProviderWithClerk`.
- [ ] Task 3: Create `convex/auth.config.ts` to link Convex with your Clerk application.
- [ ] Task 4: Update the database schema (`projects` table) to include a `userId` string.
- [ ] Task 5: Update backend mutations (`createProject`, `listProjects`, `deleteProject`) to verify the user is logged in and only return/modify their own projects.
- [ ] Task 6: Add User Profile / Sign Out UI to the Navbar.

## Done When
- [ ] A user must log in to see the home page or create a project.
- [ ] A user cannot access another user's project ID via the URL.
- [ ] Projects automatically sync to the logged-in user's identity via Convex Auth.
