# Exact Location Redirect Feature

## Objective
Create a feature where, when a user clicks on a bug from the bug list, the system automatically redirects to the exact webpage and highlights the exact location where the bug was reported.

## Implementation Details

1. **Schema Update (`convex/schema.ts`)**
   - Added `scrollX` and `scrollY` to the `bugs` table to store the exact viewport scroll position when the bug is reported.

2. **Backend Mutation Update (`convex/bugs.ts`)**
   - Updated the `createBug` mutation to accept and save `scrollX` and `scrollY`.

3. **Widget Script Update (`public/widget/bugscribe-widget.js`)**
   - **Capture**: The widget now automatically captures `window.scrollX` and `window.scrollY` at the exact moment the "Report Bug" button is clicked.
   - **Highlight**: Added a `window.addEventListener('load')` to parse the URL hash for `#bugscribe-highlight=x,y`. 
   - When a user lands on a page with this hash, the script smooth-scrolls to the exact coordinate and renders an animated targeted pulse overlay with a red tint to highlight exactly where the bug is.

4. **UI Dashboard Update (`app/dashboard/[projectId]/page.tsx`)**
   - Updated the main bug card in `KanbanColumn` and the table row in `ListView`. Now, clicking the bug redirects the user natively to the exact webpage appending the `#bugscribe-highlight` hash.
   - Added a specific "Edit/View Details" action button on both views (styled with an eye-catching hover effect and `bs-no-redirect` class) so the user can still open the `BugDetailDrawer`.
   - Updated the direct URL link in the Bug Details drawer to also format the hash parameters correctly.

## Status
- [x] Schema modified.
- [x] Backend mutations configured.
- [x] Widget capture and render logic implemented.
- [x] Dashboard bug list interaction refactored.

All code edits are implemented and ready to test!
