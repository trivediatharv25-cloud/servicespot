# ServiceSpot — Real-Time Service Booking Platform

A MERN stack booking/scheduling app where **providers** (tutors, consultants,
salons, doctors, etc.) open time slots for their services, and **users**
book them. The core differentiator is the **real-time layer built with
Socket.io**: the moment a slot is booked, every other user browsing that
service sees it disappear instantly (no refresh), and the provider gets an
instant notification.

## Features

- **Real-time booking** with atomic slot-claiming (no double-booking) and Socket.io notifications
- **Razorpay payment integration (test mode)** — paid services require a verified payment before a booking is confirmed; free services (price = 0) skip payment entirely
- **Per-service ratings & reviews** — users can rate a specific service (1-5 stars + comment) after a confirmed booking; each service has its own independent rating, not a blended provider-wide score
- **Calendar view** for providers (`react-big-calendar`) — see all your slots (available/booked) in a weekly calendar instead of a flat list
- **Favorites/wishlist** — users can heart a service and filter to "favorites only"
- **Search** across service title, description, address, and provider name
- **Photo gallery per service** — a cover photo plus optional extra photos
- **Cancellation policy** — users can only cancel a booking up to 2 hours before it starts; providers aren't bound by this
- **Input validation** (`express-validator`) on auth, service, booking, and review endpoints
- **Rate limiting** (`express-rate-limit`) — a general API-wide limit, a stricter one on auth (brute-force protection), and one on booking creation (spam protection)
- **Unit tests** (`jest`) covering the payment-signature verification logic
- **Animated landing page**, welcome toast on login, and phone/location fields on signup

## Why this project (talking points for interviews)

1. **Preventing double-booking under concurrency** — the hardest real
   problem in any booking system. If two users click "Book" on the same
   slot within milliseconds of each other, a naive
   "read slot → check available → update" flow has a race condition: both
   requests can read "available" before either writes "booked".
   `bookingController.js` fixes this with a single **atomic**
   `findOneAndUpdate({ status: "available" }, { status: "booked" })` —
   MongoDB guarantees only one of the two concurrent requests can match and
   update the document; the other gets `null` back and is told the slot's
   gone. This is a genuinely good system-design answer to give in an
   interview.

2. **Socket.io real-time layer** — three real-time events:
   - `slot:booked` — broadcast to everyone browsing so a booked slot
     disappears live for other users.
   - `notification:new` — targeted at just the provider, using
     **socket rooms** (`user:<id>`) so we don't spam every connected client.
   - `slot:created` / `slot:reopened` — new/cancelled slots appear/reappear
     live too.

3. **Role-based access control** — two roles (`user`, `provider`) sharing
   one User model, with route-level middleware (`requireRole`) rather than
   duplicating auth logic per route.

4. **Persisted notifications** — notifications are saved to Mongo
   (`Notification` model), not just pushed over the socket, so a provider
   who was offline still sees them when they next log in. Socket.io alone
   would lose messages sent while a client is disconnected.

5. **Server-side payment verification** — the frontend calls Razorpay's
   checkout, but the backend never trusts it blindly. `bookingController.js`
   re-derives the expected HMAC-SHA256 signature from the order id + payment
   id using the secret key, and only creates the booking if it matches what
   Razorpay sent. A user tampering with the frontend (e.g. calling the booking
   API directly with fake payment ids) gets rejected with a 400.

6. **One review per booking, not per provider** — the `Review` schema has a
   unique index on `booking`, and `Booking.reviewed` is flipped to `true`
   once reviewed, so the same booking can't be rated twice, but a user can
   still leave separate reviews for separate bookings with the same provider.

7. **Ratings scoped per service, not per provider** — `getAverageRatingsForServices`
   groups by the `service` field, not `provider`. A provider offering both a
   Hair Spa and Music Lessons doesn't have reviews from one bleed into the
   other's rating — a subtle but important data-modeling decision.

8. **Defense-in-depth validation** — `express-validator` rejects malformed
   input (bad email, short password, out-of-range rating) at the route layer,
   before it ever reaches a controller or the database, on top of Mongoose's
   own schema validation.

9. **Rate limiting tiers** — a generous general limit on all `/api` routes,
   a stricter one on `/api/auth` (slows down password-guessing), and one on
   `/api/bookings` (stops someone from hammering the booking endpoint to try
   to win a race against another user).

## Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, JWT auth, bcrypt
- **Frontend**: React (Vite), React Router, Tailwind CSS, Axios, socket.io-client

## Project structure

```
slotsync/
├── server/
│   ├── config/db.js          # MongoDB connection
│   ├── models/                # User, Service, Slot, Booking, Notification
│   ├── middleware/auth.js     # JWT verification + role guard
│   ├── controllers/           # business logic (bookingController.js is the key file)
│   ├── routes/
│   ├── socket.js              # socket.io connection/room handling
│   └── server.js              # entry point
└── client/
    └── src/
        ├── context/            # AuthContext, SocketContext
        ├── pages/              # Login, Register, BrowseServices, dashboards
        ├── components/         # Navbar, SlotCard, NotificationBell
        └── api/axios.js        # axios instance with JWT auto-attached
```

## Running it locally

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a free MongoDB Atlas cluster — just change `MONGO_URI`)

### 1. Backend
```bash
cd server
cp .env.example .env      # then edit JWT_SECRET and MONGO_URI if needed
npm install
npm run dev                # starts on http://localhost:5000
```

**For the payment feature to work**, get free TEST MODE keys:
1. Sign up at https://dashboard.razorpay.com (no business verification needed for test mode)
2. Go to Settings > API Keys > Generate Test Key
3. Paste the Key Id and Key Secret into `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
4. Use Razorpay's test card `4111 1111 1111 1111`, any future expiry, any CVV, to simulate a successful payment

Services with price = 0 skip payment entirely, so you can test the rest of the app without setting this up.

### 2. Frontend
```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173`, register once as a **provider** and once as a
**user** (use two different browser profiles or an incognito window so you
can watch the real-time updates between the two sessions live).

## Suggested flow to demo it (great for a live interview walkthrough)

1. Register as a provider → create a service → open a slot for it.
2. In a second window, register/login as a user → go to Browse → book that slot.
3. Watch the provider's notification bell update **instantly**, with no refresh.
4. Open a third window as a different user, try to book the same slot the
   user in step 2 already grabbed — you'll get the "already booked" message,
   proving the atomic update is working.

## Running tests

```bash
cd server
npm test
```

Runs Jest against `tests/payment.test.js`, which verifies the Razorpay
signature check accepts valid signatures and rejects tampered/replayed ones.

## Possible extensions (good "what would you add next" answers)

- Image upload (Cloudinary/S3) instead of pasting photo URLs
- Email/SMS reminders before the appointment (node-cron + nodemailer)
- Admin panel for approving/verifying providers
- Refresh tokens instead of a single long-lived JWT
- Integration tests with Supertest + an in-memory MongoDB instance
