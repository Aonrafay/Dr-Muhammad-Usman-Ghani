# Supabase Setup (Customer + Admin)

## 1) Create project

1. Create a new project in Supabase.
2. Open Project Settings -> API.
3. Copy `Project URL` and `anon public` key.

## 2) Add schema

1. Open SQL Editor in Supabase.
2. Run the SQL from `supabase/schema.sql`.

## 3) Configure website keys

1. The current config files are already filled from `supabase/.env`:
   - `frontend/assets/js/supabase-config.js`
   - `admin/assets/js/supabase-config.js`
2. If keys change, update both files with:
   - `url`: your project URL
   - `anonKey`: your anon public key

## 4) Create admin auth user

1. Open Supabase Dashboard -> Authentication -> Users.
2. Create user with your admin credentials:
   - Email: `aonrafay@gmail.com`
   - Password: `qaz123@`
3. This is required because dashboard read/update policies are for `authenticated` role.

## 5) Admin access note

- Public website now submits appointments and contact forms directly to Supabase.
- Admin dashboard reads/updates records through Supabase after login.
- Admin panel status changes are pushed to Supabase immediately.
- If sync fails, admin dashboard shows an error in "Database sync status".

## 6) Optional hardening

1. Disable local cache fallback in `admin/assets/js/admin.js` if you want strict remote-only behavior.
2. Restrict admin read/update policies by role/claims.
3. Add role-based checks in Supabase Auth user metadata.

## 7) Test flow

1. Submit appointment from `frontend/appointment.html`.
2. Submit contact message from `frontend/contact.html`.
3. Open `admin/index.html` and confirm entries appear.
4. Change appointment status from admin and confirm it persists.
