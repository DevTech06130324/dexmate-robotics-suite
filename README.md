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

## Demo

- **Frontend (Vercel):** [https://dexmate-robotics-suite.vercel.app](https://dexmate-robotics-suite.vercel.app)
- **Backend API (Railway):** [https://dexmate-robotics-suite-production.up.railway.app/api](https://dexmate-robotics-suite-production.up.railway.app/api)

Use the seeded credentials below to sign in and explore the end-to-end flows.

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

## Brief Write-up

### Technology Choices
- **Node.js + Express (Backend):** Chosen for its lightweight request handling, mature ecosystem, and straightforward middlewares for auth, validation, and logging. TypeScript provides type safety and clearer contracts for route handlers and DB access.
- **PostgreSQL:** Offers strong relational integrity for group/permission relationships while JSONB columns let us store per-user robot settings without additional migrations as keys evolve.
- **React + TypeScript (Frontend):** Enables a responsive SPA with clear component contracts. React Router supports the multi-page flows (auth, dashboard, robot detail, groups) with protected routes bound to auth context.
- **JWT Authentication:** Simplifies stateless auth across backend/frontend deployments, enabling the frontend to persist tokens and refresh user context without sticky sessions.
- **Railway + Vercel Deployments:** Provide quick managed hosting with CI-style deploys triggered from `main`, minimizing ops overhead for the demo requirement.

### Trade-offs & Design Decisions
- **Route-centric business logic:** Controllers house most application logic to keep the codebase lean for the assessment. A service layer would increase reuse and testability but add boilerplate for this scope.
- **Database-first seeding:** SQL schema + seed script favor transparency and align with Railway’s SQL console. Using an ORM (e.g., Prisma) could add migrations and model syncing at the cost of extra tooling.
- **Client-driven validation:** Frontend performs minimal form validation; deeper validation resides server-side for trust. Additional schema validation (e.g., Zod/Joi) could further harden inputs.
- **Settings stored as JSON:** This keeps user preferences flexible but sacrifices strong typing at the DB level. Specialized columns could enable richer queries but would require migrations for new fields.
- **Limited observability:** Logging is minimal (morgan + console). Production deployments would typically integrate structured logging and monitoring, but this was deferred to keep focus on core functionality.

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
- **Railway (backend):** The live service exposes the REST API at the URL above. Environment variables (`DATABASE_URL`, `JWT_SECRET`, optional `PORT`) are configured in Railway, and the database schema/seed script are applied via Railway’s SQL console + `npm run seed`. Cold starts may add a short delay (~5s) on the first request after inactivity.
- **Vercel (frontend):** The React build is published at the URL above with `REACT_APP_API_URL` pointing to the Railway backend. Redeploys occur automatically from `main`.

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
