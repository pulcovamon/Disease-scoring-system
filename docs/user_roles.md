# User Roles & User Management

## User Roles

There are three roles defined in `api/auth/roles.py`:

| Role | Value | Default |
|---|---|---|
| `user` | `"user"` | ✅ assigned on registration |
| `scientist` | `"scientist"` | — |
| `admin` | `"admin"` | — |

---

## User Lifecycle

### 1. Registration

`POST /api/v1/auth/user` — open to anyone, no auth required.

- Account is created with `role = "user"` and `is_approved = False`.
- Password is bcrypt-hashed with a random salt, stored in the `auth` table separately from the `users` table.
- **The user cannot do anything useful until an admin approves them.**

### 2. Approval

`POST /api/v1/auth/user/approval` — admin only.

- Sets `is_approved = True` on the user record.
- There is no rejection endpoint — unapproved users simply stay in the pending state.
- Role assignment must be done directly in the database; there is no API endpoint to change a user's role.

### 3. Login

`POST /api/v1/auth/token` — HTTP Basic credentials (email + password).

- Returns a JWT Bearer token valid for **15 days**.
- All subsequent requests attach the token as `Authorization: Bearer <token>`.

---

## What each role can do

### `user` (default, must be approved)

- Run predictions using **default** models only (unauthenticated users can do this too)
- View their own patient records
- View their own prediction history
- List other users (name, email, username only — no roles or IDs)

### `scientist` (must be approved)

- Everything a `user` can do
- **Upload ML models** (own models)
- **Edit and delete** their own models
- Run predictions on **public models** and models shared with them
- Share models with other users

### `admin`

- Everything a `scientist` can do
- **Approve** new user registrations
- **List all users** with full details (roles, IDs, approval status)
- **Modify and delete any model** regardless of owner
- View all prediction results system-wide

---

## Permission Matrix

| Action | Unauthenticated | `user` (approved) | `scientist` (approved) | `admin` |
|---|---|---|---|---|
| Register | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| Run prediction (default model) | ✅ | ✅ | ✅ | ✅ |
| Run prediction (public model) | ❌ | ✅ | ✅ | ✅ |
| Run prediction (private model) | ❌ | ❌ | owner only | ✅ |
| Upload model | ❌ | ❌ | ✅ | ✅ |
| Edit / delete own model | ❌ | ❌ | ✅ | ✅ |
| Edit / delete any model | ❌ | ❌ | ❌ | ✅ |
| List users (basic info) | ❌ | ✅ | ✅ | ✅ |
| List users (full details) | ❌ | ❌ | ❌ | ✅ |
| Approve users | ❌ | ❌ | ❌ | ✅ |
| View all predictions | ❌ | ❌ | ❌ | ✅ |

---

## Database Schema

User data is split across two MySQL tables:

**`users`**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `first_name` | string | |
| `last_name` | string | |
| `email` | string | Unique, indexed |
| `username` | string | Unique, optional |
| `role` | string | `user` / `scientist` / `admin` |
| `is_approved` | bool | `False` until admin approves |

**`auth`**

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID | FK → `users.id` |
| `hashed_password` | string | bcrypt hash |
| `salt` | bytes | random salt |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/user` | None | Register a new user |
| `POST` | `/auth/token` | HTTP Basic | Login, returns JWT |
| `GET` | `/auth/user/me` | JWT | Get own profile |
| `GET` | `/auth/user` | JWT (any role) | List users (detail level depends on role) |
| `GET` | `/auth/users/count` | None | Total registered user count |
| `POST` | `/auth/user/approval` | JWT (admin) | Approve a pending user |

---

## Known Limitations

- **No role-change endpoint** — promoting a `user` to `scientist` requires direct database access.
- **No rejection or deactivation** — unapproved users stay pending indefinitely; there is no API endpoint to explicitly reject or disable an account.
- **No approval-status query** — a user has no way to check whether their account is approved without attempting an action and receiving a `403`.
