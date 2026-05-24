<div align="center">
  <h1 align="center">VedaAI Assessment Creator</h1>
  <p align="center">
    <strong>An AI-powered assessment creation platform for teachers</strong>
    <br/>
    VedaAI allows teachers to create custom assignments in seconds by describing a topic. The AI generates structured question papers with sections and an answer key. The platform handles the full lifecycle: assignment generation, real-time status streaming, paper preview, and PDF exporting. Built on Next.js, Express, MongoDB, BullMQ, and Google Gemini — with real-time progress streaming via WebSockets.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-cyan?logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Express.js-Node.js-green?logo=node.js" alt="Express" />
    <br/>
    <img src="https://img.shields.io/badge/MongoDB%20Atlas-Database-47A248?logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
    <img src="https://img.shields.io/badge/Upstash-Redis%20%26%20BullMQ-00E9A3?logo=redis&logoColor=white" alt="Upstash" />
    <img src="https://img.shields.io/badge/Render-Backend-46E3B7?logo=render&logoColor=white" alt="Render" />
    <br/>
    <a href="https://assignment-veda.vercel.app/">
      <img src="https://img.shields.io/badge/Live_Demo-Vercel-black?logo=vercel" alt="Live Demo" />
    </a>
  </p>
</div>

## UI Screenshots
<p align="center">
  <img src="./frontend/public/dashboard.png" alt="Desktop View" height="500" />
  &nbsp; &nbsp; &nbsp;
  <img src="./frontend/public/mobile_view.png" alt="Mobile View" height="500" />
</p>

---

## Local setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional for local DB/Redis)
- A MongoDB Atlas free cluster (or local instance)
- An Upstash Redis database (or local instance)
- A Google Gemini API Key

### Backend
```bash
cp backend/.env.example backend/.env
# Fill in: MONGODB_URI, REDIS_URL, GEMINI_API_KEY, JWT_SECRET, FRONTEND_URL
cd backend && npm install && npm run dev
```
Server runs at `http://localhost:4000`.

### Frontend
```bash
cp frontend/.env.local.example frontend/.env.local
# Fill in: NEXT_PUBLIC_API_URL
cd frontend && npm install && npm run dev
```
App runs at `http://localhost:3000`.

---

## Architecture overview

```text
┌─────────────────────────────────────────────────────────────┐
│  Next.js 15 frontend (Vercel)                               │
│  - JWT Auth stored in cookies                               │
│  - Zustand store for assignment creation state              │
│  - html2pdf.js for client-side desktop-caliber PDF export   │
│  - WebSocket client for live job progress notifications     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│  Express backend (Render)                                   │
│  - Custom JWT Auth + express-rate-limit                     │
│  - BullMQ worker — AI paper generation jobs                 │
│  - WebSocket server — streams job progress to browser       │
│  - Multer — handles uploaded reference files/images         │
│  - Zod — runtime validation for incoming requests           │
└────────┬────────────────────────────┬───────────────────────┘
         │                            │
   MongoDB Atlas                  Redis (Upstash)
   (documents)                    (BullMQ queue)
         │
   Google Gemini 2.5 Flash
   (paper generation)
```

## Why each technology

| Tool | Role | Why not something simpler |
|---|---|---|
| **Zod** | Validation | Single source of truth for runtime validation on API endpoints, preventing malformed data from reaching the database. |
| **BullMQ + Redis** | Job queue | AI calls to Gemini can take 5–15 seconds. Pushing them to a background queue prevents HTTP timeouts, frees up the main Node thread, and allows the frontend to poll/stream progress reliably. |
| **WebSocket** | Real-time | Pushes `job:progress`, `job:completed`, and `job:failed` events directly to the browser tab that submitted the job, so the loading screen updates dynamically. |
| **Zustand** | Client state | Holds the complex multi-step assignment form data in memory (Question counts, types, time allowance). |
| **html2pdf.js** | PDF Generation | Allows perfect 1024px desktop-formatted exports directly from the client, even if the user is on mobile. |
| **JWT** | Auth | Lightweight, stateless session management, eliminating the need for complex session stores or third-party paid auth providers. |

---

## Data models

### User
Handles custom authentication for teachers using the platform.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Full name of the user |
| `email` | string | Unique login credential |
| `password` | string | Hashed with bcryptjs |
| `role` | "teacher" \| "student" | Default is teacher |
| `schoolName` | string | Set at onboarding |

### Assignment
A paper generation job created by a teacher.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Owner (teacher) |
| `subject` | string | e.g. "Science" |
| `topic` | string | e.g. "Photosynthesis" |
| `className` | string | e.g. "10th Grade" |
| `dueDate` | Date | When the assignment is due |
| `questionTypes` | `{type, count, marks}[]` | e.g. `[{type:"MCQ", count:5, marks:2}]` |
| `status` | "pending" \| "processing" \| "completed" \| "failed" | Updated by the BullMQ worker |
| `jobId` | string | Maps to BullMQ job |
| `resultId` | ObjectId? | Set when generation completes |

### Result
The AI-generated Question Paper linked to an Assignment.

| Field | Type | Notes |
|---|---|---|
| `jobId` | string | Unique index mapping to the BullMQ job |
| `assignmentId` | ObjectId | Links back to the assignment configuration |
| `userId` | ObjectId | Owner (teacher) |
| `paper` | Object | The structured JSON output from Gemini AI |

*The `paper` object includes sections, schoolName, totalMarks, generalInstruction, questions (with difficulty tags), and a private answerKey.*

---

## User flows

### Teacher flow
1. **Sign up / Login** → Standard JWT-based authentication.
2. **Dashboard (`/home`)** → View recent assignments and quick stats.
3. **Creation Form (`/create`)** → Multi-step form: fill in title, subject, class, and configure specific question types/counts. Can also upload context files/images.
4. **Processing (`/loading/[jobId]`)** → Live WebSocket progress: *Starting job → Analyzing content → Generating questions → Validating JSON → Saving paper.*
5. **Output View (`/result/[jobId]`)** → Review the professional exam layout, see dynamic difficulty badges, and view the answer key.
6. **Export** → Click "Download PDF" to get a perfectly formatted A4 paper.

---

## API Routes & Middleware

**Middleware Chain**: Most routes are protected by the `authenticate` middleware, which verifies the JWT token in the `Authorization` header.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT token |
| `GET` | `/api/auth/me` | Fetch current user details |
| `POST` | `/api/assignments` | Create an assignment → Enqueues BullMQ job |
| `GET` | `/api/assignments` | List all assignments for the authenticated user |
| `GET` | `/api/assignments/:id` | Get specific assignment details |
| `GET` | `/api/results/job/:jobId` | Fetch the AI-generated paper once completed |

---

## Paper generation pipeline

1. Teacher submits form → `POST /api/assignments` validates payload with Zod.
2. BullMQ job `generate-paper` is enqueued, and the HTTP request returns the `jobId`.
3. Worker picks up job:
   - **Analyzing** — reads uploaded files/images if any.
   - **Generating** — calls Google Gemini 2.5 Flash with strict JSON-schema prompt and deterministic instructions.
   - **Validating** — automatically categories questions into logical Sections (A, B) and assigns Difficulties (Easy, Moderate, Hard).
   - **Saving** — writes the `Result` document to MongoDB Atlas and updates `Assignment.status = "completed"`.
4. The WebSocket server simultaneously emits `job:progress` and `job:completed` directly to the frontend.
5. Browser auto-redirects from `/loading/[jobId]` to `/result/[jobId]`.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Root: `frontend/`, Framework: Next.js 15 |
| Backend | Render | Root: `backend/`, starts via `node dist/index.js` |
| Database | MongoDB Atlas | Free tier |
| Queue / Cache | Upstash Redis | Free tier, used for BullMQ and aggressive caching |
