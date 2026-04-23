# Product Requirements Document (PRD): BugScribe
**A Comprehensive Visual Feedback, Bug Tracking, and Project Management Suite**

---

## 1. Executive Summary
**BugScribe** is an all-in-one platform for software teams to collect visual feedback, track bugs, and manage project workflows. It extends beyond a simple browser widget, offering a Chrome Extension, a native iOS app, and an advanced admin dashboard with AI-powered features. Built with **Next.js** and **Convex** (with **Supabase** support), it provides a real-time, cross-platform experience for QA testers, developers, and product managers.

## 2. Target Audience
*   **QA Testers:** To report bugs across Web, iOS, and via Chrome Extension.
*   **Developers:** To receive rich debug data, including console logs, network info, and screenshots.
*   **Product Managers:** To manage projects, analyze feedback, and oversee bookings/locations.
*   **End Users:** To provide feedback and interact with booking widgets.

## 3. UI/UX Design System

### 3.1 Design Principles
*   **Modern & Immersive:** A "Deep Carbon" dark theme with "Electric Cyan" accents.
*   **Glassmorphism:** Use of translucent backgrounds, subtle glows, and blurred overlays for depth.
*   **Real-time Feedback:** Live status updates and instant notifications across all interfaces.
*   **Premium Feel:** Smooth transitions, high-quality iconography (Lucide), and a clean, high-contrast typography (Inter).

### 3.2 Color Palette
*   **Background:** `#09090E` (Deep Carbon)
*   **Surface (Cards):** `#111118` (Elevated Surface)
*   **Primary Accent:** `#00D4FF` (Electric Cyan)
*   **Secondary Accent:** `#FF6B35` (Signal Orange for alerts/critical issues)
*   **Borders:** `#1E1E2E` (Subtle boundary)

### 3.3 Key UI Components
*   **Project Cards:** Large, rounded (24px) cards with gradient glows, containing project metadata, real-time bug stats (Total, Open, Critical), and API key management.
*   **Command Center:** A centralized dashboard header for quick actions (New Project, User Management) and global search.
*   **Kanban Board:** A real-time drag-and-drop interface for managing bug statuses with column-based organization.
*   **Feedback Widget:** A minimal, non-intrusive floating button that expands into a full-screen visual feedback overlay.
*   **Navigation:** A responsive navbar with blurred background and glassmorphism effects.

## 4. Key Functional Requirements

### 4.1 The Feedback Ecosystem
*   **Web Widget:** A lightweight JavaScript snippet for client websites.
*   **Chrome Extension:** A dedicated tool for reporting bugs on any website without installing a script.
*   **iOS Native App:** Mobile bug reporting and project management on the go.
*   **Visual Feedback:** Overlay tools, screenshot capture, and annotation (Pen, Rectangle, Arrow, Blur).
*   **Metadata Collection:** URL, Browser/OS, Resolution, and Console Logs.

### 4.2 AI-Powered Tools
*   **Grammar Checker:** Integrated tool to ensure bug descriptions are professional and clear.
*   **AI Rephraser:** Automatically rephrase bug reports for better clarity and technical accuracy.
*   **URL Analysis:** Analyze target URLs for potential issues or metadata extraction.

### 4.3 Admin Dashboard (Next.js Panel)
*   **Project Management:** Multi-project support with unique API keys.
*   **User Management:** Role-based access control (RBAC). Admins can approve new users, change roles (User vs. Super Admin), and manage access.
*   **Real-time Analytics:** Visual insights into bug trends, project health, and user activity.
*   **Module System:** Enable/disable specific dashboard features (Analytics, Bookings, etc.).

### 4.4 Booking & Location Management
*   **Map Locations:** Manage physical locations on an interactive map (Leaflet).
*   **Booking Widget:** A specialized widget for users to book services or appointments.
*   **Admin Booking Panel:** Manage schedules, status, and client details.

### 4.5 Data & Integrations
*   **Import/Export:** Bulk import bugs via CSV/JSON; Export reports as ZIP files with annotated images.
*   **PWA Support:** Service worker integration for offline access and home screen installation.
*   **Email Notifications:** Automated alerts via Resend for new bugs or status changes.

## 5. Technical Architecture

### Tech Stack
*   **Frontend:** Next.js 16+ (App Router), React 19, Tailwind CSS.
*   **Backend:** Convex (Default) or Supabase (Alternative).
*   **Mobile:** Swift (iOS Native).
*   **Extension:** Manifest V3 (JavaScript).
*   **Real-time:** Convex Subscriptions / Supabase Realtime.
*   **Maps:** Leaflet.
*   **AI:** Custom API routes with grammar/rephrasing logic.

## 6. Backend Configuration

### 6.1 Convex Configuration (Default)
The primary backend handling database, auth, and file storage.

#### Data Model (`convex/schema.ts`)
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    apiKey: v.string(),
    createdAt: v.number(),
  }).index("by_api_key", ["apiKey"]),

  bugs: defineTable({
    projectId: v.id("projects"),
    status: v.string(),
    priority: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    browser: v.string(),
    url: v.string(),
    consoleErrors: v.optional(v.array(v.string())), 
    screenshotStorageId: v.id("_storage"),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  bookings: defineTable({
    projectId: v.id("projects"),
    clientName: v.string(),
    date: v.number(),
    status: v.string(),
  }).index("by_project", ["projectId"]),

  mapLocations: defineTable({
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
  }),

  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    role: v.string(), // "user" | "super_admin"
    isApproved: v.boolean(),
  }).index("by_email", ["email"]),
});
```

### 6.2 Supabase Configuration (Alternative)
Required for teams preferring traditional SQL and Supabase's ecosystem.

#### Database Schema (PostgreSQL)
```sql
-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bugs Table
CREATE TABLE bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  browser TEXT,
  url TEXT,
  console_errors JSONB,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supabase Storage Bucket: `bug-reports`
```

## 7. Roadmap / MVP Phasing

### Phase 1: Core Feedback
*   Web Widget + Convex Backend.
*   Screenshot & Metadata capture.
*   Basic Dashboard with Kanban.

### Phase 2: Platform Expansion
*   Chrome Extension release.
*   iOS Native App (MVP).
*   PWA Support.

### Phase 3: AI & Advanced Admin
*   AI Grammar & Rephrasing.
*   Advanced Analytics & User Management (RBAC).
*   Booking & Map Location modules.

## 8. Success Metrics
*   **Omnichannel Reporting:** Ability to capture bugs from any device or browser environment.
*   **Resolution Speed:** Decrease bug resolution time through AI-enhanced reports and rich metadata.
*   **User Engagement:** High adoption of the booking and location modules for integrated project management.
