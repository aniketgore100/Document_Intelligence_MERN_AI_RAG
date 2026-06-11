# Document Intelligence

Document Intelligence is a full-stack role-based operations portal for managing organizations, departments, users, invitations, permissions, and documents.

## Project Scope

- Multi-role access model for `GLOBAL_ADMIN`, `ORG_ADMIN`, and `DEPT_ADMIN`
- Organization onboarding and invite flows
- Department creation, inspection, and permission management
- Document upload, listing, and deletion for organization admins
- Dashboard views that change based on the authenticated user role
- Secure backend APIs with authentication, authorization, validation, and rate limiting

## Code Pattern

- Backend follows a layered structure: routes, controllers, services, repositories, models, middleware, and workers
- Business logic lives in service classes such as `dashboardService`, `departmentService`, and `organizationService`
- Repositories isolate database queries and keep MongoDB access consistent
- Frontend uses React with Redux Toolkit and RTK Query for state and server data
- Route protection is enforced with `ProtectedRoute` and `RoleProtectedRoute`
- UI is split into reusable layout and page components, with role-specific views rendered from a shared shell
- Document upload uses a direct upload flow to object storage, then completes the upload through the API
- Background processing is handled through a worker for invite emails

## Final Outcome

The finished product is an internal admin dashboard that lets an organization:

- create and manage organizations and departments
- invite users into the right role and scope
- control department-level permissions
- upload and maintain shared documents
- view role-specific dashboards with a clean, authenticated experience

In short, the final output is a working multi-tenant management app that centralizes organization administration, access control, and document operations in one place.

## Tech Stack

- Frontend: React, Vite, Redux Toolkit, RTK Query, React Router, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, MongoDB, Mongoose
- Infrastructure: JWT auth, CORS, Helmet, rate limiting, S3-style file storage, queue-based invite handling

## Repository Layout

- `frontend/` - React application and user-facing pages
- `backend/` - API server, business logic, models, and workers

## Run Notes

The frontend and backend are separate apps and are started independently.

- `frontend`: Vite development server
- `backend`: Express server with MongoDB connection

If you want, I can also add a short `Getting Started` section with exact install and run commands once you confirm the preferred env file names and ports.
