# Permissions Management Feature Plan

## Overview
The Super Admin needs a dedicated global page to define granular permissions for different project roles (Admin, Editor, Viewer) using a toggle/dot UI. Based on these configurations, the dashboard will dynamically show/hide tabs (Users, API, Settings) and features.

## 1. Convex Backend Schema & Functions (`backend-specialist`)
- **Schema Update**: Add a new table `rolePermissions` that stores mapping for roles to specific fine-grained permission string arrays:
  - `role`: string (e.g., "admin", "editor", "viewer", "owner")
  - `permissions`: array of strings (e.g., `["view_api", "view_settings", "manage_users", "delete_bugs", "move_bugs"]`)
- **Queries & Mutations**:
  - `permissions:getGlobal`: Fetches all roles and their linked permissions.
  - `permissions:setGlobal`: Updates the permissions for a specific role (Requires Super Admin).
  - `projects:getMyPermissions`: Fast query returning the current user's granular permissions for a given `projectId` based on their role in `projectMembers`.
- **Init Script**: Write a one-off or initial logic to seed default permissions if the table is empty.

## 2. Frontend: Admin Permissions Page (`frontend-specialist`)
- **Route**: New page at `app/dashboard/settings/permissions/page.tsx` (or an admin-specific route `app/admin/permissions`).
- **UI Component**:
  - A matrix table where rows are specific permissions (View API, Manage Team, Edit Settings) and columns are Roles (Admin, Editor, Viewer).
  - Cells contain boolean toggles (dots/checkboxes).
  - Ensure the page checks if the `isSuperAdmin` is true before rendering.

## 3. Applying Permissions to Dashboard (`frontend-specialist`)
- **Action**: Modify `app/dashboard/[projectId]/page.tsx` and related components.
- **Logic**: 
  - Fetch `projects:getMyPermissions` for the active project.
  - Use the returned boolean flags to conditionally render the "Users", "API", and "Settings" tabs in the Tabs component.
  - Ensure any data fetching for those tabs acts gracefully if hidden.
