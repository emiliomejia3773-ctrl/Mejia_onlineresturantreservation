# Aurelia — Restaurant Reservation Website (MERN)

A premium, responsive restaurant site: **React 18 + Vite** frontend and an **Express + MongoDB (Mongoose)** backend in `server/`.
Accounts, bookings, table availability, the admin dashboard and staff management are all stored in MongoDB and protected by JWT login.

## Run locally

Requires Node.js 20.6 or newer and a MongoDB server (local, or a free MongoDB Atlas cluster). MongoDB 6.0+ is required.

```bash
cd restaurant-reservation
npm run install:all                 # frontend + server dependencies
cp server/.env.example server/.env  # then edit MONGODB_URI and JWT_SECRET
npm run seed                        # creates tables, sample staff, bookings and demo accounts
npm run server                      # API on http://localhost:5000
npm run dev                         # website on http://localhost:5173 (proxies /api to the server)
```

Run `npm run server` and `npm run dev` in two terminals. `npm run seed -- --reset` wipes the data and reseeds.

Production: `npm run build`, then run the server with `NODE_ENV=production` (it also serves `dist/`). In production `JWT_SECRET` (32+ characters) and `MONGODB_URI` are required, and the seeded demo passwords must be changed or the seeded users deleted.
To host the API on a different origin, build the frontend with `VITE_API_URL=https://api.example.com` and set `CLIENT_ORIGIN` on the server.

Server unit tests (availability logic, no database needed): `cd server && npm run test:logic`.

## Seeded accounts

| Account | Email | Password | After login |
|---|---|---|---|
| Customer | `demo@aurelia.com` | `Demo@1234` | Booking and customer dashboard |
| Admin | `admin@aurelia-demo.com` | `Admin@1234` | Admin area, including Staff Management |
| Manager | `maria.santos@aurelia-demo.com` | `Staff@1234` | Admin area: dashboard, reservations and Staff Management (staff records other than Managers) |

Only the administrator and Managers have a login. Other roles (Reservations, Floor and Kitchen Staff) are saved as records without an account and cannot sign in. Seeded staff records: Jules Resonable (Reservations Staff) and John Kenneth (Floor Staff). Override the seed passwords with the `SEED_*` variables in `server/.env`. Development builds show quick-fill buttons for these accounts on the login page; production builds do not.

## Routes

| Path | Page | Access |
|---|---|---|
| `/` | Home | public |
| `/menu`, `/about`, `/gallery`, `/contact` | Content pages | public |
| `/login`, `/register` | Sign in / create account | public |
| `/book-now` | Reservation form | **login required** |
| `/booking-confirmation` | Confirmation with reference number | login required |
| `/dashboard` | Customer dashboard | login required |
| `/reservations/:id/edit` | Change an upcoming reservation | login required |
| `/admin` | Admin dashboard: summary cards, charts, activity, notifications | admin or staff login |
| `/admin/staff` | Staff Management: hire, edit, roles, activate/deactivate, terminate or delete (permanently removes the record), sign-in activity | admin or Manager |
| `/admin/staff/:id` | Staff profile | admin or Manager |
| `/admin/reservations` | Reservations table (with CSV export), calendar, and table overview (admin can add/edit/remove tables) | admin or staff login |
| `/change-password` | Change own password; new staff are sent here on first login | any login |

### Login-before-booking flow
Every "Book Now" / "Reserve a Table" button links to `/book-now`. `ProtectedRoute` checks the signed-in user in `AuthContext`: logged-out visitors are redirected to `/login` with the message *"Please log in to continue with your reservation."* and the page they wanted is remembered, so a successful login returns them to `/book-now`. Logging out clears the state and the protected pages redirect to login again.

## Project structure

```
restaurant-reservation/
├── src/                      # React app
│   ├── api.js                # fetch wrapper + JWT storage
│   ├── context/              # AuthContext (login/register/session), ReservationContext (my bookings)
│   ├── admin/AdminContext.jsx# admin data + actions via the API
│   └── ...                   # components, pages, styles as before
└── server/
    ├── src/index.js, app.js, config.js, seed.js
    ├── src/models/           # User, Staff (employees + admin), Reservation, Table, Activity, Notification, ContactMessage
    ├── src/routes/           # auth, public (availability, contact), reservations (customer), admin (staff + admin)
    ├── src/services/         # booking creation with table assignment
    ├── src/utils/            # availability engine, time helpers, security, audit log
    └── test/                 # availability unit tests
```

## API

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | Create a customer account |
| `POST /api/auth/login` | public | One login for customers, staff and admin; returns a JWT and `kind` |
| `GET /api/auth/me` | any | Restore the session on page load |
| `POST /api/auth/change-password` | any | Change own password (page: `/change-password`); also clears a new hire's "must change password" flag |
| `GET /api/availability?date&guests&area[&exclude]` | public | Bookable time slots from real table capacity (`exclude` = a booking being edited) |
| `POST /api/contact` | public | Contact form; stored and shown as an admin notification |
| `GET /api/reservations/mine` | customer | My bookings |
| `POST /api/reservations` | customer | Book a table (server picks the smallest free table) |
| `PUT /api/reservations/:id` | customer | Change date, time, party size, seating or notes (up to 4 hours before); table is re-assigned if needed |
| `PATCH /api/reservations/:id/cancel` | customer | Cancel my booking (up to 4 hours before) |
| `GET /api/admin/bootstrap` | staff, admin | Reservations, tables, activity, notifications, staff in one call |
| `PATCH /api/admin/reservations/:id/status` | staff, admin | Confirm, reject, check in, seat, complete, no-show, ... |
| `GET /api/admin/tables` | staff, admin | Live table board |
| `DELETE /api/admin/reservations/:id` | admin only | Delete a reservation. **Permanently deletes it from MongoDB** |
| `POST /api/admin/tables`, `PUT/DELETE /api/admin/tables/:code` | admin only | Add, edit (area, seats, out of service) or remove a table (**a removed table is permanently deleted from MongoDB**); refused if upcoming bookings would break |
| `POST/PUT /api/admin/staff`, `PATCH .../:id/active` | admin, Manager | Hire, edit, activate/deactivate. Managers cannot create or change Manager accounts or their own account |
| `POST /api/admin/staff/:id/terminate` | admin, Manager | Fire an employee (reason and date required). **Permanently deletes the employee's document from MongoDB** |
| `DELETE /api/admin/staff/:id` | admin, Manager | Delete an employee. **Permanently deletes the employee's document from MongoDB** (same effect as terminating, without a reason) |

## How the main rules work

- **Availability:** a booking holds one table for 90 minutes. A slot is open only if some in-service table in the chosen area seats the party and is not held by an overlapping booking. A unique index on date + time + table stops two people taking the same table at once; the loser sees "that time was just taken".
- **Status on booking:** parties of 4 or fewer are `confirmed`; larger parties are `pending` until staff approve them. Cancelled, rejected, completed and no-show bookings free their table.
- **Time zone:** "today", the 60-minute booking cut-off and the 4-hour cancellation window use `RESTAURANT_TZ`.
- **Staff accounts:** deactivated staff are blocked at login and their existing sessions stop working on the next request. Deactivating keeps the record and can be undone by activating the account again.
- **Admin deletions are permanent:** when the administrator (or, for staff, a Manager) fires an employee, deletes an employee, deletes a reservation or removes a table, the document is deleted from MongoDB. There is no recycle bin or undo, and the database keeps no copy.
- **Firing or deleting staff removes their data from MongoDB:** both *Terminate* and *Delete* permanently delete the employee's document from the `staff` collection (profile, phone, email, hiring date and sign-in history). It cannot be undone and the person disappears from the staff list. Their login, if they were a Manager, stops working immediately because the account no longer exists. What remains is one line in the `activities` collection (name, EMP number, who/what happened and, for terminations, the reason and effective date) and an admin notification, so there is still an audit trail. Reservations, customer accounts and tables are not affected. The administrator account cannot be deleted this way, and nobody can fire or delete their own account. Use **Deactivate** instead if you may need the record again.
- **Passwords:** hashed with bcrypt. Only Managers have a login. Hiring (or promoting) someone as Manager creates their login automatically with a random temporary password shown once to the admin (no email is sent). On first sign-in the Manager is sent to `/change-password` and must choose their own password first. Other roles are records only.
- **Security basics:** helmet, rate limiting on login/register/contact, request validation with zod, JWT in the `Authorization` header, admin-only routes enforced on the server, not just hidden in the UI.

## Not included yet

Email (confirmations, password reset, staff invitations), refresh tokens/cookie sessions, payments, and menu management from the admin screen.

## Changing the content

- Restaurant name, address, hours, testimonials: `src/data/siteData.js`. **Opening hours and booking limits are also in `server/src/config.js`; keep the two in step.**
- Menu: `src/data/menuData.js`
- Seating areas and booking rules: `src/data/reservationData.js` and `server/src/config.js`
- Photos: `src/data/images.js` (Unsplash IDs; each has a gradient fallback)
- Colors and fonts: the `:root` tokens at the top of `src/styles/global.css`
