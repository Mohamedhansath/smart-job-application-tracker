# ApplyFlow — Smart Job Application Tracker

A responsive, frontend-only job application tracker built with React, Vite and browser LocalStorage.

## Features
- Dashboard summary for total applications, applied, shortlisted/interview and selected.
- Add, edit and delete job applications.
- Track company, role, location, employment type, status, dates, salary, job URL and notes.
- Search by company, role or location; filter by status; sort by date.
- Automatic LocalStorage persistence (data stays in this browser on this device).
- Export and import application data as JSON.
- Responsive layout for desktop and mobile.

## Run locally
```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build
```bash
npm run build
npm run preview
```

## Tech
React 18 · Vite · JavaScript · CSS · lucide-react · LocalStorage

## Privacy and limitations
This app has no backend and sends no application data to a server. Data is stored only in the browser's LocalStorage. Clearing browser site data can erase it, so use JSON export for backups. This is a portfolio/demo project, not a secure multi-user system.
