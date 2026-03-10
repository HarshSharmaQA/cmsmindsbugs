# BugScribe 🐛

**Visual feedback & bug tracking for software teams.** Capture screenshots, annotate issues, and resolve bugs faster by embedding an intelligent widget directly into your React applications.

Built with **Next.js 14**, **Convex** (Backend/DB), **Clerk** (Authentication), **Resend** (Email Alerts), and **Tailwind CSS**.

---

## 🚀 Quick Start

Follow these steps to start the application and test the entire workflow from end to end:

### 1. Start the Development Server
Since everything is already configured, you run exactly one command to boot up both the **Next.js Frontend** and the **Convex Backend** simultaneously. 

Open a terminal at the root of the project (`cmsminds-ai-agent/bug tracking/`) and run:
```bash
npm run dev
```

### 2. Log In & Create a Project
1. Open your browser to **[http://localhost:3000](http://localhost:3000)**.
2. Click **Sign In** and authenticate using Clerk (Google, GitHub, or Email).
3. Once on the Dashboard, click the **New Project** button.
4. Give your project a **Name** (e.g. "Main Website").
5. Click **Create Project**.
6. 🚨 A banner will appear with an **API Key**. Copy this key! You will need it to configure the demo widget in the next step.

### 3. Configure the Demo Widget
We have a built-in static HTML file that simulates a "client's website" to test the floating bug widget without having to inject it into a real production app.

1. Open `public/widget-demo.html` in VS Code.
2. Scroll to the very bottom to find the `<script>` tag.
3. Replace the `data-project-id` with your brand new project's ID (You can find this ID in your browser's URL bar when viewing the project on the dashboard. It will look like: `http://localhost:3000/dashboard/jd7...`).
4. Replace the `data-api-key` with the API Key you copied in Step 2.
5. Save the file.

### 4. Test the End-to-End Flow
1. Navigate your browser to the Demo Page: **[http://localhost:3000/widget-demo.html](http://localhost:3000/widget-demo.html)**
2. In the bottom right corner, click the floating **🐛 Report Bug** button.
3. Use the built-in pen tools to draw on the screen and highlight an issue.
4. Fill out the bug details in the form, and hit **Submit**.
5. Wait ~3 seconds for the upload to complete.
6. Check your Inbox! An email notification via Resend has been dispatched to the Super Admin.
7. Go back to your Dashboard at **[http://localhost:3000](http://localhost:3000)** and click on your Project.
8. You will see your new bug automatically appear in the **New Issues** column of your Kanban Board!
9. Try clicking and dragging the bug card into the **In Progress** column. The database updates instantly!

---

## 🔑 Environment Variables
If you are setting this up on a fresh machine, you must configure these variables in both `.env.local` and your **Convex Cloud Dashboard > Environment Variables**.

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://...

# Resend Email Integration
RESEND_API_KEY=re_...

# Super Admin God Mode 
# (Comma-separated list of emails that bypass all ownership rules)
SUPER_ADMIN_EMAILS=harshsharmaqa@gmail.com, admin@example.com
```

## 🛠 Tech Stack Details
* **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
* **Widget Engine**: Native Javascript, Custom Web Components, `html2canvas`.
* **Backend**: Convex Serverless Functions (`mutation`, `query`, `internalAction`).
* **Storage**: Convex File Storage (Screenshots).
* **Database**: Convex Realtime Database.
* **Authentication**: Clerk JWT integration via `ConvexReactProviderWithClerk`.
* **Drag and Drop**: `@hello-pangea/dnd`.
* **Emails**: Resend API.
