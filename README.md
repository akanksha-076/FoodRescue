# FoodRescue — Surplus Food Donation & Management Platform

## 1. Project Title and Overview

**FoodRescue** is a full-stack web application designed to reduce edible food waste by connecting surplus food donors (restaurants, hotels, catering services, and event organizers) with verified Non-Governmental Organizations (NGOs) and community relief kitchens. The platform provides end-to-end surplus listing management, concurrency-safe donation claiming, pickup and completion verification, trust ratings, and administrative moderation.

---

## 2. Problem Statement

Restaurants, hotels, and large events frequently generate safe, edible surplus food at the end of service windows, while local shelters and community food banks struggle to source timely meals. Without a centralized coordination platform:
- Donors lack an easy channel to broadcast perishable surplus with preparation and pickup deadlines.
- NGOs waste time calling potential donors without knowing quantities, allergens, or pickup windows.
- Multiple charities risk arriving for the same food batch when claims are not tracked atomically.

---

## 3. Proposed Solution

FoodRescue provides a centralized, role-based platform where:
1. **Donors** publish surplus food items with photos, preparation/use-by/pickup deadlines, allergen notes, and storage instructions.
2. **NGOs** search and filter available food listings by keyword, category, location, minimum quantity, and urgency, then request exact quantities.
3. **Atomic Quantity Reservation** ensures two NGOs cannot claim the same remaining food quantity concurrently.
4. **Structured Status Transitions** enforce `Available → Requested → Approved → Picked Up → Completed`, preventing premature completion before pickup.
5. **Administrators** verify organizations, suspend abusive accounts, moderate inappropriate listings, and monitor live platform analytics.

---

## 4. Target Users

- **Food Donors:** Restaurants, hotels, bakeries, corporate cafeterias, and event organizers.
- **NGOs / Receivers:** Registered charities, food banks, shelters, and community kitchens.
- **Platform Administrators:** Governance team responsible for partner verification, safety moderation, and impact reporting.

---

## 5. Features and Functionalities

- JWT-based authentication with `bcryptjs` password hashing and role-based authorization (`donor`, `ngo`, `admin`).
- Rate-limited authentication endpoints (`express-rate-limit`).
- User profile management with image upload support.
- Full CRUD for surplus food donations with automatic expiry detection when pickup deadlines pass.
- Image upload integration via **Cloudinary** when configured, with automatic fallback to local `/uploads` storage.
- Multi-criteria search, filtering, sorting, and pagination for food listings.
- Concurrency-safe NGO donation request and donor approval workflow.
- Status tracking across all 8 statuses: `Available`, `Requested`, `Approved`, `Rejected`, `Picked Up`, `Completed`, `Cancelled`, `Expired`.
- Post-completion rating & review system (`1–5` stars + comments).
- Admin dashboard with user verification/suspension, listing moderation, request monitoring, and statistical charts.
- Responsive UI with in-app toast notifications, loading states, empty states, and form validation.

---

## 6. Technology Stack and Explanation

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React 18, Vite, JavaScript | Component-based SPA with fast HMR and production bundling |
| **Routing & HTTP** | React Router DOM, Axios | Role-protected client routing and centralized API/JWT interceptors |
| **UI & Icons** | HTML5, CSS3, Lucide React | Responsive forest-green & cream startup design system |
| **Backend** | Node.js, Express.js | Modular REST API server with middleware architecture |
| **Security** | JWT, bcryptjs, Helmet, CORS, Express Rate Limit, Express Validator | Authentication, password hashing, headers, input validation, rate limiting |
| **Database** | MongoDB, Mongoose | Document storage with ObjectId references, schema validation, and indexes |
| **Media Upload** | Multer, Cloudinary | Multipart file parsing and cloud/local image persistence |

---

## 7. System Architecture

```text
┌─────────────────────────────┐         REST / JSON + JWT         ┌────────────────────────────────┐
│   React + Vite Frontend     │ ◄───────────────────────────────► │   Express.js REST API Server   │
│  - Landing / Browse / Auth  │                                   │  - Auth & RBAC Middleware      │
│  - Donor / NGO / Admin UI   │                                   │  - Validation & Rate Limiter   │
└─────────────────────────────┘                                   │  - Controllers & Services      │
                                                                  └───────────────┬────────────────┘
                                                                                  │ Mongoose ODM
                                                                  ┌───────────────▼────────────────┐
                                                                  │           MongoDB              │
                                                                  │  Users | Donations | Requests  │
                                                                  │            Reviews             │
                                                                  └────────────────────────────────┘
```

---

## 8. Database Collections and Schema Explanation

### `User` (`backend/models/User.js`)
- `name` (String, required, 2–80 chars)
- `email` (String, required, unique, lowercase)
- `password` (String, required, min 6 chars, `select: false`, bcrypt hashed)
- `role` (Enum: `'donor' | 'ngo' | 'admin'`, default `'donor'`)
- `phone`, `organizationName`, `address`, `profileImage` (Strings)
- `isVerified` (Boolean, default `false`), `isSuspended` (Boolean, default `false`)
- `createdAt`, `updatedAt` (Timestamps)

### `Donation` (`backend/models/Donation.js`)
- `donorId` (ObjectId ref `User`, indexed)
- `foodName`, `category`, `description`, `unit`, `image`, `pickupLocation`
- `quantity` (Number ≥ 1), `availableQuantity` (Number ≥ 0 and ≤ `quantity`)
- `preparedAt`, `useBy`, `pickupDeadline` (Dates)
- `allergenInformation`, `storageInformation` (Strings)
- `status` (Enum: `'Available' | 'Requested' | 'Approved' | 'Rejected' | 'Picked Up' | 'Completed' | 'Cancelled' | 'Expired'`)
- Text and compound indexes on `{ status, pickupDeadline, category }` and `{ foodName, description, pickupLocation }`

### `Request` (`backend/models/Request.js`)
- `donationId` (ObjectId ref `Donation`, indexed)
- `ngoId` (ObjectId ref `User`, indexed)
- `requestedQuantity` (Number ≥ 1)
- `message` (String)
- `status` (Enum: `'Requested' | 'Approved' | 'Rejected' | 'Picked Up' | 'Completed' | 'Cancelled' | 'Expired'`)
- `pickedUpAt`, `completedAt`, `createdAt`, `updatedAt`

### `Review` (`backend/models/Review.js`)
- `donationId` (ObjectId ref `Donation`), `reviewerId` (ObjectId ref `User`), `revieweeId` (ObjectId ref `User`)
- `rating` (Number 1–5), `comment` (String), `createdAt`
- Unique compound index `{ donationId, reviewerId }`

---

## 9. Actors and Their Permissions

| Actor | Permissions |
| --- | --- |
| **Donor** | Register/login, manage profile, create/edit/cancel/delete eligible donations, upload food images, view incoming requests, approve/reject requests, confirm pickup & completion, review NGOs. |
| **NGO / Receiver** | Register/login, manage profile, browse/search/filter donations, request available quantities, cancel pending/approved requests, confirm pickup & completion, view history, review donors. |
| **Admin** | Secure login, view platform statistics & charts, verify/unverify donors & NGOs, suspend/reactivate accounts, view and delete inappropriate listings, monitor all donation requests. |

---

## 10. Installation Prerequisites

- **Node.js** v18+ (tested with v24.x)
- **npm** v9+
- **MongoDB** Community Server running locally on port `27017` (or a MongoDB Atlas URI)
- **Git**

---

## 11. GitHub Cloning Instructions

```bash
git clone <your-repository-url>
cd FoodRescue
```

---

## 12. Dependency Installation

Install dependencies for both `backend` and `frontend`:

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 13. Environment Variable Configuration

Create `.env` files from the provided `.env.example` templates:

### `backend/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/foodrescue
JWT_SECRET=replace_with_a_long_random_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_REGISTRATION_KEY=replace_with_admin_setup_key

# Optional Cloudinary credentials (if omitted, images save locally in backend/uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 14. MongoDB Setup and Connection

1. Start MongoDB locally (default `mongodb://127.0.0.1:27017`) or copy your MongoDB Atlas connection string into `MONGODB_URI`.
2. Optional — seed sample users, donations, requests, and reviews into MongoDB:
   ```bash
   cd backend
   npm run seed
   ```
   Seeded demo accounts (password for all: `Password@123`):
   - **Admin:** `admin@foodrescue.org`
   - **Donor:** `donor@greenbistro.com`
   - **NGO:** `ngo@hopeharvest.org`

---

## 15. Commands to Run Frontend and Backend

Open two terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

**Run Automated Backend Integration Tests:**
```bash
cd backend
npm test
```

---

## 16. Localhost URLs

- **Frontend Application:** `http://localhost:5173`
- **Backend REST API Base URL:** `http://localhost:5000/api`
- **API Health Check:** `http://localhost:5000/api/health`

---

## 17. Complete Actor-Wise API Documentation

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Purpose | Role |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a donor, NGO, or admin (with `adminSecret`) | Public |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch current authenticated user profile | Authenticated |
| `PUT` | `/api/auth/profile` | Update profile fields and optional `profileImage` | Authenticated |

### Donation Endpoints (`/api/donations`)

| Method | Endpoint | Purpose | Role |
| --- | --- | --- | --- |
| `GET` | `/api/donations` | Browse donations (`q`, `category`, `location`, `minQuantity`, `deadlineBefore`, `status`, `sort`, `page`, `limit`) | Public |
| `GET` | `/api/donations/my` | List authenticated donor's own donations with request counts | Donor |
| `GET` | `/api/donations/:id` | Get single donation details (plus NGO's own request if authenticated as NGO) | Public / Optional Auth |
| `GET` | `/api/donations/:id/requests` | List all NGO requests for a specific donation | Donor (owner) / Admin |
| `POST` | `/api/donations` | Create a new donation listing (multipart or JSON) | Donor |
| `PUT` | `/api/donations/:id` | Update an eligible donation listing | Donor (owner) |
| `PATCH` | `/api/donations/:id/cancel` | Cancel an open donation and its pending/approved requests | Donor (owner) |
| `DELETE` | `/api/donations/:id` | Delete a donation with no approved/collected requests | Donor (owner) |

### Request Endpoints (`/api/requests`)

| Method | Endpoint | Purpose | Role |
| --- | --- | --- | --- |
| `POST` | `/api/requests` | Submit a request for a donation (`donationId`, `requestedQuantity`, `message`) | NGO |
| `GET` | `/api/requests/my` | List authenticated NGO's submitted requests | NGO |
| `GET` | `/api/requests/incoming` | List all incoming NGO requests across donor's listings | Donor |
| `PATCH` | `/api/requests/:id/approve` | Atomically reserve `requestedQuantity` and approve request | Donor (owner) |
| `PATCH` | `/api/requests/:id/reject` | Reject a pending request | Donor (owner) |
| `PATCH` | `/api/requests/:id/pickup` | Transition `Approved` → `Picked Up` | Donor (owner) / Requesting NGO |
| `PATCH` | `/api/requests/:id/complete` | Transition `Picked Up` → `Completed` | Donor (owner) / Requesting NGO |
| `PATCH` | `/api/requests/:id/cancel` | Cancel request (restores `availableQuantity` if previously approved) | Requesting NGO |

### Review & Public Stats Endpoints (`/api/reviews`, `/api/stats`)

| Method | Endpoint | Purpose | Role |
| --- | --- | --- | --- |
| `POST` | `/api/reviews` | Submit rating (`1–5`) and comment for a completed donation | Donor / NGO participant |
| `GET` | `/api/reviews/user/:userId` | Retrieve reviews and average rating for a user | Public |
| `GET` | `/api/reviews/public` | Fetch recent high-rated reviews for testimonials | Public |
| `GET` | `/api/stats/public` | Fetch live aggregate impact metrics | Public |
| `GET` | `/api/health` | Service health check | Public |

### Admin Endpoints (`/api/admin`)

| Method | Endpoint | Purpose | Role |
| --- | --- | --- | --- |
| `GET` | `/api/admin/users` | List/filter users (`role`, `verified`, `suspended`, `q`) | Admin |
| `PATCH` | `/api/admin/users/:id/verify` | Verify or unverify a user (`{ isVerified }`) | Admin |
| `PATCH` | `/api/admin/users/:id/suspend` | Suspend or reactivate a user (`{ isSuspended }`) | Admin |
| `GET` | `/api/admin/donations` | View all platform donations with filters | Admin |
| `DELETE` | `/api/admin/donations/:id` | Remove an inappropriate donation and linked records | Admin |
| `GET` | `/api/admin/requests` | Monitor all donation requests across platform | Admin |
| `GET` | `/api/admin/stats` | Retrieve platform KPIs, status/category breakdowns, recent activity | Admin |

---

## 18. API Request Examples

### Register a Donor (`POST /api/auth/register`)
```json
{
  "name": "Elena Rostova",
  "email": "donor@greenbistro.com",
  "password": "Password@123",
  "role": "donor",
  "organizationName": "The Green Bistro",
  "phone": "+91 98111 22334",
  "address": "42 Indiranagar, Bengaluru"
}
```

### Submit NGO Request (`POST /api/requests`)
Headers: `Authorization: Bearer <NGO_JWT_TOKEN>`
```json
{
  "donationId": "6745abc123def45678901234",
  "requestedQuantity": 20,
  "message": "Our refrigerated van can collect by 6:30 PM."
}
```

---

## 19. Expected JSON Responses

### Success Response (`201 Created` on `/api/requests`)
```json
{
  "success": true,
  "message": "Donation request submitted successfully.",
  "data": {
    "request": {
      "_id": "6745abd123def45678909999",
      "donationId": {
        "_id": "6745abc123def45678901234",
        "foodName": "Vegetable Pulao Trays",
        "status": "Requested",
        "availableQuantity": 60
      },
      "requestedQuantity": 20,
      "status": "Requested"
    }
  }
}
```

### Error Response (`409 Conflict` when concurrent approval exceeds remaining quantity)
```json
{
  "success": false,
  "message": "Insufficient remaining quantity to approve this request. Another NGO may have claimed it."
}
```

---

## 20. Authentication Requirements

Protected endpoints require the `Authorization` header:
```text
Authorization: Bearer <JWT_TOKEN>
```
Tokens are signed with `JWT_SECRET` and verified on every protected request via `backend/middleware/auth.js`. Suspended accounts (`isSuspended: true`) are blocked from logging in and accessing protected endpoints.

---

## 21. Screenshots Section

Place application screenshots in the `screenshots/` directory (e.g., `landing-page.png`, `donor-dashboard.png`, `ngo-browse.png`, `admin-analytics.png`) and link them here for your capstone submission.

---

## 22. Future Enhancements

- Real-time WebSocket/Socket.io push notifications for instant request alerts.
- Interactive map view (Leaflet / Google Maps) for distance-based pickup routing.
- Automated email/SMS reminders prior to pickup deadlines.
- Exportable PDF/CSV impact certificates for corporate CSR reporting.

---

## 23. Contributors

- **Capstone Developer:** Web Development 3 Capstone Project Author
