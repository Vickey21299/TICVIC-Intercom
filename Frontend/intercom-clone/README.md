# Intercom Clone - Admin & Agent Support Portal

A premium React support desk application configured with Vite, TypeScript, and a unified design system. It allows workspace administrators and support agents to collaborate, resolve tickets, configure AI automation, and verify custom domains.

---

## 🔒 Session Authentication

- **Dynamic Authentication Panel** ([`Login.tsx`](file:///c:/Users/vickey.kumar/Desktop/intercom/Frontend/intercom-clone/src/pages/Login/Login.tsx)): Supports authentication against backend Firebase profiles, saving details inside `localStorage` (`ticvic_user`), and handles automatic routing guards.
- **Auto-Redirections**:
  - Admins (e.g. `admin@acme.com` / `admin123`) route to the **Admin Dashboard** (`/admin/*`).
  - Agents (e.g. `alice.johnson@acme.com` / `agent123`) route to the **Agent Dashboard** (`/agent/*`).

---

## 👑 Admin Features (`/admin/*`)

The Administrator portal is configured to manage the entire support desk configuration:

1. **Dashboard Analytics**:
   - Renders performance stats (Total Conversations, Waiting Replies, Resolved, Response Times) and conversation activity trends.
2. **Centralized Inbox**:
   - Lists all workspace threads. Admins can view conversation details, change priority fields, assign to specific support agents, trigger manual AI Summarizations, and respond.
3. **Customer Directory**:
   - Comprehensive log of all customers. Supports search, drawer-based support history lookups, and past conversation indexes.
4. **Knowledge Base Manager**:
   - CRUD interface to manage support articles. Auto-generates article slugs and provides preview options.
5. **AI Automation Center**:
   - Configures the bot's system persona instructions, toggle settings, and prompt context models.
6. **Workspace Settings**:
   - Configures custom CNAME help-center domains (e.g., `help.acme.com`), displays CNAME/TXT challenge records, and triggers backend DNS verification checks & SSL certificate provisioning.

---

## 👤 Support Agent Features (`/agent/*`)

The Agent portal isolates dashboards and tickets to streamline agent productivity:

1. **Agent Dashboard**:
   - Displays support metrics for assigned queues (Total assigned, open, pending, high priority) alongside a quick-view grid of the 5 most recent active conversations.
   - Leverages a visual `LoadingSpinner` and caching to render views instantly.
2. **Dedicated Agent Inbox**:
   - Filters the conversation lists to show **only** those threads assigned to the logged-in agent.
3. **Agent Customers List**:
   - Displays a customer directory restricted to contacts with threads actively assigned to the logged-in agent.
4. **Availability & Profile Settings**:
   - Profile module enabling agents to toggle their status between **Online (Available)** and **Offline (Away)** and configure custom text signatures.

---

## ⚡ Stale-While-Revalidate (SWR) Caching

To guarantee instant UI loading:
- **Inbox Lists & Details Caching**: Conversations and thread messages are stored in `localStorage`. Transitioning between chats renders local data instantly while updates sync silently in the background.

---

## Run Development Server

```bash
npm install
npm run dev
```
