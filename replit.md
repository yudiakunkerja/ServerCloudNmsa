# RemindMe Pro Workspace

## Overview

pnpm workspace monorepo using TypeScript. A premium collaborative reminder, notes, and alarm PWA with Firebase real-time push notifications and group-based messaging.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: React + Vite (artifacts/remindme-pro)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Push notifications**: Firebase Cloud Messaging (FCM)
- **Real-time**: Firestore onSnapshot
- **PWA**: Web App Manifest + Service Worker (firebase-messaging-sw.js)

## Firebase Config

- Project: `projectforworl-server`
- VAPID Key set in VITE_FIREBASE_VAPID_KEY env var

## Key Features

1. **Personal Reminders** — Create, edit, delete reminders with priority levels and schedule
2. **Notes** — Create and manage personal notes
3. **Alarms** — Set recurring/one-time alarms with Web Audio API tones
4. **Groups** — Public groups with invite codes, real-time messaging
5. **Group Push Notifications** — FCM tokens registered per device, notifications sent to group members
6. **PWA Installation** — Install on Android, iOS, Windows via browser
7. **Background Service Worker** — Receives push notifications even when app is closed
8. **Startup Popup** — Shows daily pending reminders when app/computer opened

## Database Tables

- `users` — User profiles (uid, displayName, email, photoUrl)
- `reminders` — Personal reminders and notes
- `alarms` — Scheduled alarms with repeat types
- `groups` — Group entities with invite codes
- `group_members` — Group membership
- `group_messages` — Group messages/reminders/alarms
- `fcm_tokens` — Per-device FCM push notification tokens

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/remindme-pro run dev` — run frontend locally

## Artifacts

- `artifacts/remindme-pro` — React Vite PWA frontend (previewPath: /)
- `artifacts/api-server` — Express 5 REST API backend (previewPath: /api)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
