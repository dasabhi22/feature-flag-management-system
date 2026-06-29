# Multi-Tenant Feature Flag Management System

## Overview

This project is a Multi-Tenant Feature Flag Management System developed as part of the Byepo Software Developer technical assessment.

The application allows a Software Host (Super Admin) to create organizations, Organization Admins to manage feature flags for their respective organizations, and End Users to check whether a feature is enabled for their organization.

The project consists of three independent React applications and a Node.js backend with PostgreSQL for persistent data storage.

---

## Tech Stack

### Frontend
- React (Vite)
- JavaScript
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt
- dotenv

---

## Project Structure

feature-flag-system/

│
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── organizations.js
│   │   │   └── flags.js
│   │   ├── db.js
│   │   ├── index.js
│   │   └── seedSuperAdmin.js
│   ├── .env
│   └── package.json
│
├── super-admin-app/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── admin-app/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── user-app/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md

---

## Features

### Super Admin
- Login using static credentials
- Create organizations
- View all organizations

### Organization Admin
- Signup (select organization during registration)
- Login
- Create feature flags
- Enable / Disable feature flags
- Delete feature flags
- View all feature flags scoped to their organization

### End User
- Select organization
- Enter a feature key
- Check whether the feature is enabled or disabled

---

## Authentication

JWT-based authentication is implemented across all protected routes. Role-based authorization is enforced via middleware.

Supported roles:
- `super_admin`
- `org_admin`

---

## Database Schema

| Table | Description |
|---|---|
| `roles` | Stores role definitions (super_admin, org_admin, end_user) |
| `organizations` | Stores organization records |
| `users` | Stores all users linked to a role and optionally an organization |
| `feature_flags` | Stores flags scoped to an organization |

### Relationships
- One Organization → many Users
- One Organization → many Feature Flags
- Each User belongs to one Organization
- Each Feature Flag is scoped to one Organization

---

## Backend API

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/signup` | Public |

### Organizations
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/organizations` | Super Admin |
| POST | `/api/organizations` | Super Admin |
| GET | `/api/organizations/public` | Public |

### Feature Flags
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/flags` | Org Admin |
| POST | `/api/flags` | Org Admin |
| PATCH | `/api/flags/:id` | Org Admin |
| DELETE | `/api/flags/:id` | Org Admin |
| GET | `/api/flags/check` | Public |

---

## Environment Variables

Create a `.env` file inside the `backend/` folder:
PORT=4000
DB_HOST=localhost

DB_PORT=5432

DB_NAME=feature_flags_db

DB_USER=your_postgres_username

DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key
SUPER_ADMIN_EMAIL=superadmin@system.com

SUPER_ADMIN_PASSWORD=superadmin123

---

## Installation & Running

### 1. Database Setup

Run the following SQL in your PostgreSQL client to create the database and tables:

```sql
CREATE DATABASE feature_flags_db;
```

Then connect to `feature_flags_db` and run:

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES ('super_admin'), ('org_admin'), ('end_user');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  feature_key VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_key, organization_id)
);

INSERT INTO users (email, password_hash, role_id, organization_id)
VALUES (
  'superadmin@system.com',
  'placeholder',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  NULL
);
```

### 2. Backend

```bash
cd backend
npm install
node src/seedSuperAdmin.js
npm run dev
```

Backend runs on `http://localhost:4000`

### 3. Super Admin App

```bash
cd super-admin-app
npm install
npm run dev
```

Runs on `http://localhost:5173`

### 4. Organization Admin App

```bash
cd admin-app
npm install
npm run dev
```

Runs on `http://localhost:5174`

### 5. End User App

```bash
cd user-app
npm install
npm run dev
```

Runs on `http://localhost:5175`

---

## Testing Flow

1. Open `http://localhost:5173` and log in as Super Admin
2. Create an organization (e.g. "Acme Corp")
3. Open `http://localhost:5174` and sign up as Org Admin, selecting your organization
4. Log in as Org Admin
5. Create feature flags (e.g. `dark_mode`, `beta_checkout`)
6. Toggle flags on or off
7. Open `http://localhost:5175`
8. Select your organization, enter a feature key, and check its status

---

## Super Admin Credentials
Email:    superadmin@system.com
Password: superadmin123

---

## Security Notes

- Passwords are hashed using bcrypt (cost factor 10)
- JWTs expire after 8 hours
- All flag operations are scoped to the admin's own organization cross-org access is blocked at the API level
- Super admin credentials are config-based (`.env`), not stored in plain text

---

## Design Decisions

- **Separate frontend apps**: Each role (Super Admin, Org Admin, End User) runs as a completely independent React application on its own port, mirroring how a real SaaS would serve different subdomains per role.
- **Public org endpoint**: `/api/organizations/public` is intentionally unauthenticated so the signup and user-check forms can list organizations without requiring a token.
- **Feature key normalization**: Keys are lowercased and trimmed on both insert and lookup, so `Dark_Mode` and `dark_mode` resolve to the same flag.
- **No third-party auth**: Authentication is fully custom — bcrypt for hashing, JWT for session tokens, middleware for role enforcement.

-----

## Author

**Abhiraj Das**  
GitHub: https://github.com/dasabhi22