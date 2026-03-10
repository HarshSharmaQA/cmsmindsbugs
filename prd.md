# Product Requirements Document (PRD): BugScribe
**A Visual Feedback & Bug Tracking Tool**

---

## 1. Executive Summary
**BugScribe** is a browser-based testing and bug tracking tool similar to UserBack.io. It allows software teams to collect visual feedback, annotated screenshots, and browser console logs directly from users or QA testers. The application is built using **Next.js** for the frontend and **Convex** for the backend, leveraging Convex’s real-time capabilities and file storage to create a seamless, live updating experience.

## 2. Target Audience
*   **QA Testers:** To report bugs quickly without leaving the application under test.
*   **Product Managers:** To prioritize issues based on visual evidence and user severity.
*   **Developers:** To receive reproducible data (console logs, screenshots, network info) instantly.

## 3. Key Functional Requirements

### 3.1 The Client-Side Widget (The "Feedback Button")
*   **Visual Feedback Overlay:** When activated, the website dims, and the user can click on any element to highlight it.
*   **Screenshot Capture:** Automatically captures the current viewport.
*   **Annotation Tools:** Pen tool (freehand), Rectangle tool, Arrow tool, and Blur tool (to hide sensitive data).
*   **Metadata Collection:** Automatically capture:
    *   URL
    *   Browser & OS Version
    *   Screen Resolution
    *   Console Errors (JavaScript errors occurring at the time of the report).
*   **Video Recording (Optional/MVP+):** Ability to record the screen for 30 seconds before submitting the bug.

### 3.2 The Dashboard (Next.js Admin Panel)
*   **Project Management:** Create multiple projects (e.g., "Staging Web", "Production App").
*   **Issue List:** A real-time list of submitted bugs.
*   **Kanban Board:** Drag-and-drop interface to move bugs between statuses (New, In Progress, Verified, Closed).
*   **Detail View:** Click a bug to see the full screenshot, annotations, console logs, and comments.
*   **Collaboration:** Team members can comment on bugs.
*   **Integration (Webhooks):** Webhook support to push bugs to Slack, Jira, or GitHub.

## 4. Technical Architecture

### Tech Stack
*   **Frontend Framework:** Next.js 16+ (App Router) & React.
*   **Styling:** Tailwind CSS.
*   **Backend / Database:** Convex (Handles Database, Auth, File Storage, and Real-time subscriptions).
*   **Image Annotation:** `react-image-annotate` or custom HTML5 Canvas logic.
*   **Screenshot Logic:** `html2canvas` (client-side).

### Data Model (Convex Schema)

The database needs to store Projects, Bugs, Attachments, and Comments.

## 5. Implementation Preview (Next.js + Convex Code)

Below is the foundational code structure to build BugScribe.

### Step 1: Convex Schema (`convex/schema.ts`)
This defines the data structure. Convex allows storing file references (StorageIds) directly in documents.

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Stores different websites/projects being tracked
  projects: defineTable({
    name: v.string(),
    domain: v.optional(v.string()), // e.g., "app.example.com"
    apiKey: v.string(), // Simple token for the widget
    createdAt: v.number(),
  }).index("by_api_key", ["apiKey"]),

  // The Bug Reports
  bugs: defineTable({
    projectId: v.id("projects"),
    status: v.string(), // "open", "in_progress", "resolved"
    priority: v.string(), // "low", "medium", "high", "critical"
    title: v.string(),
    description: v.optional(v.string()),
    // Metadata
    browser: v.string(), // User Agent string
    url: v.string(), // Page where bug occurred
    consoleErrors: v.optional(v.array(v.string())), 
    // Visuals
    screenshotStorageId: v.id("_storage"), // Pointer to Convex file storage
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  // Comments on bugs
  comments: defineTable({
    bugId: v.id("bugs"),
    author: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_bug", ["bugId"]),
});
```

### Step 2: Convex Mutation (`convex/bugs.ts`)
This function handles uploading the screenshot and creating the bug record in one transaction.

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new bug with a screenshot
export const createBug = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    browser: v.string(),
    url: v.string(),
    file: v.bytes(), // The raw screenshot bytes
  },
  handler: async (ctx, args) => {
    // 1. Store the image in Convex Storage
    const storageId = await ctx.storage.store(args.file);

    // 2. Insert the Bug document
    const bugId = await ctx.db.insert("bugs", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      browser: args.browser,
      url: args.url,
      status: "open",
      priority: "medium", // default
      screenshotStorageId: storageId,
      createdAt: Date.now(),
    });

    return bugId;
  },
});

// Fetch bugs for the dashboard
export const getBugs = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const bugs = await ctx.db
      .query("bugs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Generate URLs for the screenshots
    return Promise.all(
      bugs.map(async (bug) => ({
        ...bug,
        screenshotUrl: await ctx.storage.getUrl(bug.screenshotStorageId),
      }))
    );
  },
});
```

### Step 3: Next.js Dashboard Component (`app/dashboard/page.tsx`)
A Kanban-style board to view and drag bugs.

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Mock Project ID for this example
const CURRENT_PROJECT_ID = "your_project_id_here" as Id<"projects">;

export default function BugDashboard() {
  const bugs = useQuery(api.bugs.getBugs, { projectId: CURRENT_PROJECT_ID });
  const updateStatus = useMutation(api.bugs.updateStatus); // You'd need to create this mutation

  if (!bugs) return <div>Loading...</div>;

  const columns = [
    { status: "open", title: "New Issues" },
    { status: "in_progress", title: "In Progress" },
    { status: "resolved", title: "Resolved" },
  ];

  return (
    <div className="p-8 grid grid-cols-3 gap-4 h-screen bg-gray-50">
      {columns.map((col) => (
        <div key={col.status} className="bg-gray-200 rounded-lg p-4">
          <h2 className="font-bold mb-4 text-gray-700">{col.title}</h2>
          <div className="space-y-3">
            {bugs
              .filter((bug) => bug.status === col.status)
              .map((bug) => (
                <div key={bug._id} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                  <img src={bug.screenshotUrl!} alt="Bug Screenshot" className="w-full h-32 object-cover rounded mb-2" />
                  <h3 className="font-semibold">{bug.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{bug.url}</p>
                  <p className="text-xs text-gray-400 mt-1">{bug.browser}</p>
                  
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => updateStatus({ bugId: bug._id, status: "resolved" })}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Step 4: The Feedback Widget Logic (Conceptual)
This is the script that would be loaded onto the *client's* website (e.g., via a `<script>` tag). It uses `html2canvas` to capture the screen.

```javascript
// This script runs on the TARGET website
import html2canvas from 'html2canvas';
import { ConvexClient } from "convex/browser";

const convex = new ConvexClient("YOUR_CONVEX_DEPLOYMENT_URL");

async function captureAndSubmit() {
  // 1. Capture Screen
  const canvas = await html2canvas(document.body);
  canvas.toBlob(async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 2. Gather Metadata
    const metadata = {
      browser: navigator.userAgent,
      url: window.location.href,
      consoleErrors: [] // Logic needed to hook console.error
    };

    // 3. Send to Convex
    await convex.mutation("bugs/createBug", {
      projectId: "PROJECT_ID_FROM_CLIENT_CONFIG",
      title: "User Reported Issue",
      description: "Visual feedback attached.",
      ...metadata,
      file: bytes,
    });
    
    alert("Bug report sent!");
  });
}

// Expose to global window for the button
window.bugScribeSubmit = captureAndSubmit;
```

## 6. Roadmap / MVP Phasing

### Phase 1: MVP (Minimum Viable Product)
*   Simple JavaScript Widget.
*   Screenshot capture.
*   Next.js Dashboard to view list of bugs.
*   Convex Database & Storage implementation.

### Phase 2: Enhanced Context
*   Console Log collection.
*   Annotation tools (draw red boxes on the screenshot before sending).
*   User identity (who submitted the bug?).

### Phase 3: Collaboration
*   Real-time comments on bugs (via Convex real-time subscriptions).
*   Slack integration (Webhooks).
*   Kanban Board sorting (Drag and Drop).

## 7. Success Metrics
*   **Time to Report:** Reduce the time it takes a tester to report a bug from 5 minutes to 30 seconds.
*   **Reproducibility:** 90% of bugs should include a screenshot and console log.
*   **Adoption:** Number of active projects using the widget.