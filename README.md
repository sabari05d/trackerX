# ⚡ TrackerX: Personal Protocol & Task Operating System

TrackerX is a high-performance, private, dark-themed habit tracking and task execution system designed to run as a cross-platform mobile application. Built using a modern decoupled stack (React, Zustand, Supabase) and wrapped natively via Capacitor, TrackerX helps optimize daily workflows, secure operational task objectives, and maintain ritual accountability with built-in native device alert protocols.

---

## 🛠️ Tech Architecture Matrix

- **Frontend Core:** React.js (Vite) + Tailwind CSS (Cyberpunk/Minimalist Dark Aesthetic)
- **State Management:** Zustand (Decoupled, high-efficiency data stores)
- **Backend Service:** Supabase (PostgreSQL Database + Row Level Security Auth + Realtime Sync)
- **Native Mobile Shell:** Ionic Capacitor (Compiled natively for Android/iOS)
- **Animations:** Framer Motion (Hardware-accelerated interface states)
- **Local Utilities:** Native Hardware Status Bar control & Local Notification Scheduling Engine

---

## 🚀 Core App Functionality & Systems

### 1. Identity & Verification Gateway (`Auth.jsx` / `Register.jsx` / `ProtectedRoute.jsx`)
- **Secure Authentication:** Managed via Supabase Auth with custom user metadata pipelines.
- **Admin Gatekeeping:** Strict authorization check preventing non-verified profiles from reading or interacting with the database. Unverified accounts are gracefully held in an "Account Pending ⏳" holding state until manual approval.
- **Persistent Sessions:** Automatic session token persistence that bypasses the Landing page smoothly via `getSession()` local verification on boot.

### 2. Operational Control Room (`Dashboard.jsx`)
- **Execution Area:** Toggle daily recurring habits (Rituals) and track completion logs synchronized to a localized timezone string layout (`YYYY-MM-DD`).
- **Gamified Progression Engine:** Completing habits unlocks visual state updates and grants explicit rewards (`+5 XP On Completion`).
- **Priority Task Matrices:** Dynamic rendering of real-time active task items tagged with corresponding urgency nodes (`High`, `Medium`, `Low`).

### 3. Protocol Ritual Management (`HabitManager.jsx` / `HabitView.jsx`)
- **Custom Ritual Vectors:** Infinite habit creation with custom semantic emojis/icons representing specific personal disciplines.
- **Alert Scheduling System:** Highly configurable local reminder schedules. Users can program specific target execution times and map them across an array of independent weekdays.
- **Notification Aggregator:** An automated, filtered scheduling queue utilizing Capacitor Local Notifications that updates, cancels, or reschedules background system alerts smoothly.
- **Archival Protocols:** Soft-delete systems that retain database structural data integrity by filtering active entries via an `is_archived` status.

### 4. Objective Tracking Core (`TaskManager.jsx` / `useTaskStore.js`)
- **Zustand Data Layer:** Isolated asynchronous action pipelines handling database communication completely separated from the UI presentation elements.
- **Dynamic Task Schedulers:** Configurable task variables including descriptions, direct calendar target due dates, and custom system-level push notification reminders (`NotificationService`).

### 5. Identity Profiles (`Profile.jsx`)
- **Binary Avatar Stream:** Direct file uploads to a Supabase Storage Bucket (`avatars`), processing unique filename hashing vectors before syncing public secure URLs back to the profile record.
- **Global Feedback Integration:** All forms, network interactions, sync pipelines, and validation steps communicate feedback states through a centralized, root-level React Context Toast system (`UIContext.jsx`).

---

## ⚡ Unified Interface Elements: Context Toast System

The architecture leverages a global, non-blocking `UIContext` provider mounted at the application root directory. Rather than instantiating state instances per component, any sub-view triggers beautiful, animated state actions dynamically with single lines of execution code:

```javascript
const { showToast } = useUI();

showToast("Protocol Logged: +5 XP", "success");  // Emerald UI Alert
showToast("System Sync Error", "error");         // Crimson UI Alert
showToast("Alert Protocol Disabled", "warning"); // Amber UI Alert