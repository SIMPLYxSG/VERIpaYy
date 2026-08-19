# VeriPay Backend

Express + TypeScript API for the VeriPay frontend. SQLite storage, bcrypt password hashing, JWT sessions in an httpOnly cookie.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Server listens on `http://localhost:8000` (matches `NEXT_PUBLIC_API_BASE_URL` in the frontend's `.env.example`).

## Dev login credentials

Created by `npm run seed`:

| Role     | Email                     | Password    |
| -------- | -------------------------- | ----------- |
| admin    | admin@veripay.local        | Admin123!   |
| employee | employee@veripay.local     | Employee123!|

Change or remove these before any real deployment.

## API

All responses use the envelope `{ success, data, message }`. Auth is a `veripay_session` httpOnly cookie set on login — the frontend must call with `credentials: "include"`.

- `POST /auth/login` — `{ email, password, role }` → sets session cookie, returns `{ user }`
- `POST /auth/logout` — clears session cookie
- `GET /auth/me` — requires session; returns `{ user }`
- `POST /admin/employees` — admin-only; `{ email, name, password, floor_id }` → creates an employee account
- `GET /admin/employees` — admin-only; lists employee accounts
