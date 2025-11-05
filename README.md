# Dexmate Robot Management System

A full-stack application for managing personal and group-owned robots with granular permissions and per-user settings. The project demonstrates a Node.js/Express + PostgreSQL backend and a React TypeScript frontend.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express, PostgreSQL, TypeScript |
| Frontend | React, TypeScript, Axios, React Router |
| Auth | JSON Web Tokens (JWT) |
| Deployment | Railway (backend), Vercel (frontend) |

## Features

- JWT-based authentication with registration and login flows.
- Users can belong to multiple groups with admin/member roles.
- Robots can be owned personally or by a group, with unique serial numbers enforced.
- Robot permissions allow granting usage or admin control to specific users.
- User-specific robot settings stored as JSON for personalized experiences.
- Dashboard listing all accessible robots with ownership and permission indicators.
- Robot detail page for viewing info, managing settings, and administering permissions.
- Group management UI for admins to invite members, adjust roles, create group-owned robots, and assign them to users.

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
1. Copy environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Update `backend/.env` with your database connection string and JWT secret.
3. Install dependencies and run database migrations:
   ```bash
   cd backend
   npm install
   psql "$DATABASE_URL" -f database/schema.sql
   ```
4. (Optional) Seed demo data:
   ```bash
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Copy environment variables:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. Update `frontend/.env` with the backend API URL if different from default.
3. Install dependencies and start the dev server:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Demo Accounts (from seed script)
- **Admin User**: `admin@example.com` / `AdminPass123!`
- **Regular User**: `member@example.com` / `MemberPass123!`

## Testing the User Flows

### Flow 1: Personal Robot Owner
1. Register or log in as any user.
2. On the dashboard, create a new personal robot.
3. Open the robot detail page and save custom settings.
4. Log out and back in—the settings should persist.

### Flow 2: Group Robot Management
1. As an admin user, create a new group.
2. Invite an existing user by email.
3. Create a group-owned robot from the group management page.
4. Assign the robot to the invited member with usage access.
5. The member logs in and sees the robot on their dashboard.
6. The member saves their own settings for the robot.

### Flow 3: Permission Management
1. Admin upgrades a member to robot "admin" permission.
2. That member can now manage robot permissions as well.
3. Member grants "usage" permission to another user in the group.

## Deployment Notes
- Backend can be deployed to Railway or any Node-friendly host. Ensure `DATABASE_URL` and `JWT_SECRET` are configured.
- Frontend can be deployed to Vercel or similar, pointing `REACT_APP_API_URL` to the backend public URL.

## Trade-offs & Design Decisions
- Kept business logic in route handlers for brevity; a service layer could improve testability for larger scopes.
- PostgreSQL chosen for relational integrity and JSONB support for settings.
- Settings stored per user/robot as JSON to remain flexible without migrations for new preference keys.
- Minimal error handling provided; production deployment should add logging/observability.

## Scripts
- `backend npm run dev` – start backend in watch mode.
- `backend npm run seed` – populate demo data and reset tables.
- `frontend npm start` – run React dev server.

## License
MIT
