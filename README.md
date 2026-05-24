<div align="center">
  <div style="padding: 20px;">
    <!-- Logo or Icon can go here -->
  </div>
  <h1 align="center" style="font-size: 3.5rem; margin-bottom: 10px; font-weight: bold; background: -webkit-linear-gradient(45deg, #0070f3, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">VedaAI</h1>
  <p align="center" style="font-size: 1.2rem; color: #666;">
    <strong>Next-Generation AI-Powered Assessment Creation Platform</strong>
  </p>
  <p align="center">
    VedaAI allows educators to generate comprehensive, highly structured question papers in seconds. By describing a topic, providing context, or uploading reference materials, the AI crafts customized assessments complete with varying difficulty levels, specific question types, and a detailed answer key.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-cyan?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Express.js-Node.js-green?style=for-the-badge&logo=node.js" alt="Express" />
    <br/>
    <img src="https://img.shields.io/badge/MongoDB%20Atlas-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
    <img src="https://img.shields.io/badge/Upstash-Redis%20%26%20BullMQ-00E9A3?style=for-the-badge&logo=redis&logoColor=white" alt="Upstash" />
    <img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
    <br/>
    <a href="https://assignment-veda.vercel.app/">
      <img src="https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
  </p>
</div>

<hr />

## <img src="https://api.iconify.design/lucide:sparkles.svg?color=white" width="24" height="24" align="top" /> Key Features

- <img src="https://api.iconify.design/lucide:brain.svg?color=white" width="18" height="18" align="top" /> **AI-Driven Generation:** Leverages Google Gemini 2.5 Flash to create contextual, accurate, and diverse questions.
- <img src="https://api.iconify.design/lucide:zap.svg?color=white" width="18" height="18" align="top" /> **Asynchronous Processing:** BullMQ & Redis manage generation tasks in the background, ensuring the server remains highly responsive.
- <img src="https://api.iconify.design/lucide:refresh-cw.svg?color=white" width="18" height="18" align="top" /> **Real-Time Updates:** WebSockets stream live progress events (e.g., Analyzing, Generating, Validating) directly to the user's dashboard.
- <img src="https://api.iconify.design/lucide:file-text.svg?color=white" width="18" height="18" align="top" /> **High-Fidelity PDF Export:** Client-side HTML-to-PDF rendering ensures perfect A4 layouts regardless of the user's device.
- <img src="https://api.iconify.design/lucide:lock.svg?color=white" width="18" height="18" align="top" /> **Secure & Stateless:** Custom JWT-based authentication combined with rigorous Zod payload validation.

---

## <img src="https://api.iconify.design/lucide:image.svg?color=white" width="24" height="24" align="top" /> UI Showcase

<table align="center" width="100%" border="0" cellspacing="0" cellpadding="8">
  <tr>
    <td align="center" width="75%">
      <strong>Desktop Dashboard</strong><br/>
      <img src="./frontend/public/dashboard.png" alt="Desktop View" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />
    </td>
    <td align="center" width="25%">
      <strong>Mobile Responsive</strong><br/>
      <img src="./frontend/public/mobile_view.png" alt="Mobile View" width="100%" style="border-radius: 8px; border: 1px solid #eaeaea;" />
    </td>
  </tr>
</table>

---

## <img src="https://api.iconify.design/lucide:layers.svg?color=white" width="24" height="24" align="top" /> High-Level Design (HLD)

The system follows a decoupled, service-oriented architecture. The frontend is a static Next.js application that communicates with a Node.js/Express backend via RESTful APIs and WebSockets. Heavy AI computations are offloaded to asynchronous workers via BullMQ.

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#000;
    classDef api fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#000;
    classDef queue fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000;
    classDef worker fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000;
    classDef db fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000;
    classDef ext fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#000;

    %% Nodes
    Client["Next.js Client App<br/> Zustand | WebSockets"]:::client
    API["Express REST API<br/> Zod | JWT"]:::api
    Redis[("Redis - Upstash<br/> BullMQ Cache")]:::queue
    Worker["Background Worker<br/> Task Processor"]:::worker
    MongoDB[("MongoDB Atlas<br/> Primary Data")]:::db
    Gemini["Google Gemini API<br/> AI Engine"]:::ext

    %% Connections
    Client <-->|REST Requests &<br/> WebSocket Streams| API
    API -->|Write/Read| MongoDB
    API -->|Enqueue Job| Redis
    Redis -->|Dequeue Job| Worker
    Worker -->|Prompt & Context| Gemini
    Gemini -->|Generated JSON| Worker
    Worker -->|Update Status & Result| MongoDB
    Worker -.->|Publish Event| Redis
    API -.->|Subscribe Event| Redis
```

### Architecture Highlights
- **Client Tier**: Next.js 15 handles routing and SSR where needed, while Zustand manages complex multi-step form states.
- **API Tier**: Express handles authentication, rate limiting, and request validation (Zod). It provides REST endpoints and a WebSocket server.
- **Message Broker Tier**: Redis (via Upstash) acts as the backbone for BullMQ, managing job queues, retries, and pub/sub for WebSocket events.
- **Worker Tier**: A dedicated Node process picks up generation jobs, communicates with Google Gemini, processes the response, and writes the final structured document to MongoDB.
- **Data Tier**: MongoDB Atlas stores Users, Assignments (job metadata), and Results (the actual generated papers).

---

## <img src="https://api.iconify.design/lucide:settings-2.svg?color=white" width="24" height="24" align="top" /> Low-Level Design (LLD)

The backend is modularized to ensure separation of concerns.

```mermaid
classDiagram
    class AssignmentRouter {
        +POST /api/assignments
        +GET /api/assignments
        +GET /api/assignments/:id
    }
    
    class AuthMiddleware {
        +verifyToken()
    }
    
    class AssignmentController {
        +createAssignment()
        +getAssignments()
    }
    
    class GenerationQueue {
        +addGenerationJob()
    }
    
    class GenerationWorker {
        +processJob()
    }
    
    class LLMService {
        +generateQuestionPaper()
    }
    
    class WebSocketService {
        +initialize()
        +broadcastToRoom()
    }

    AssignmentRouter --> AuthMiddleware : Protected by
    AssignmentRouter --> AssignmentController : Routes to
    AssignmentController --> GenerationQueue : Enqueues job
    GenerationQueue ..> GenerationWorker : Redis Trigger
    GenerationWorker --> LLMService : Calls Gemini
    GenerationWorker --> WebSocketService : Emits Progress
```

### Key Modules
1. **Middlewares**: `auth.middleware.ts` decodes JWTs; `upload.middleware.ts` (Multer) handles context file uploads.
2. **Controllers**: Map HTTP requests to business logic. Validates inputs using `zod`.
3. **Services**: Core logic. `AIService` constructs the Gemini prompts and handles retry logic.
4. **Workers**: BullMQ `Worker` instance that executes the heavy lifting without blocking the main event loop.

---

## <img src="https://api.iconify.design/lucide:database.svg?color=white" width="24" height="24" align="top" /> Database Schema (ERD)

The MongoDB schema is designed relationally using `ObjectIds` to link users, their generation requests, and the final results.

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String name
        String email "Unique"
        String password "Hashed"
        String role "teacher/student"
        String schoolName
        String schoolLocation
        String avatarUrl
        Date createdAt
        Date updatedAt
    }

    ASSIGNMENT {
        ObjectId _id PK
        ObjectId userId FK
        String subject
        String topic
        String className
        String schoolName
        String timeAllowed
        Date dueDate
        Array questionTypes "{type, count, marks}"
        String additionalInfo
        String fileContent
        Array images "{data, mimeType}"
        String status "pending/processing/completed"
        String jobId "BullMQ Job ID"
        ObjectId resultId FK "Nullable until complete"
        Date createdAt
        Date updatedAt
    }

    RESULT {
        ObjectId _id PK
        String jobId "Unique Index"
        ObjectId assignmentId FK
        ObjectId userId FK
        Object paper "Structured JSON from AI"
        Date createdAt
        Date updatedAt
    }

    USER ||--o{ ASSIGNMENT : "creates"
    USER ||--o{ RESULT : "owns"
    ASSIGNMENT ||--o| RESULT : "generates"
```

---

## <img src="https://api.iconify.design/lucide:git-merge.svg?color=white" width="24" height="24" align="top" /> System Flow Diagram

### Assignment Creation & Real-Time Sync
This sequence illustrates how an assignment is requested and how the user is kept updated in real-time.

```mermaid
sequenceDiagram
    actor Teacher
    participant NextJS as Frontend
    participant Express as Backend API
    participant Redis as BullMQ / Redis
    participant Worker as Background Worker
    participant Gemini as Google Gemini AI
    participant Mongo as MongoDB

    Teacher->>NextJS: Submits "Create Assignment" Form
    NextJS->>Express: POST /api/assignments (Auth + Payload)
    Express->>Mongo: Create Assignment (status: pending)
    Express->>Redis: Enqueue 'generate-paper' Job
    Redis-->>Express: Return jobId
    Express-->>NextJS: 200 OK { jobId }
    
    NextJS->>NextJS: Redirect to /loading/[jobId]
    NextJS->>Express: Connect WebSocket (room: jobId)
    
    Worker->>Redis: Dequeue Job
    Worker->>Express: Publish 'processing' event via Redis
    Express->>NextJS: WebSocket Event: "Analyzing Context"
    
    Worker->>Worker: Parse Files / Context
    Worker->>Gemini: Request generation (JSON Schema)
    Gemini-->>Worker: Return JSON Payload
    
    Worker->>Mongo: Save Result Document
    Worker->>Mongo: Update Assignment (status: completed, resultId)
    
    Worker->>Express: Publish 'completed' event via Redis
    Express->>NextJS: WebSocket Event: "Job Completed"
    
    NextJS->>NextJS: Redirect to /result/[jobId]
    NextJS->>Express: GET /api/results/job/[jobId]
    Express-->>NextJS: Return Renderable Paper JSON
    NextJS-->>Teacher: Displays beautiful UI & PDF Export
```

---

## <img src="https://api.iconify.design/lucide:terminal.svg?color=white" width="24" height="24" align="top" /> Local Setup & Installation

### Prerequisites
- **Node.js**: v18+
- **Docker & Docker Compose**: (optional for local DB/Redis)
- **MongoDB**: A free cluster on MongoDB Atlas (or local instance)
- **Redis**: An Upstash Redis database (or local instance)
- **Google Gemini API Key**: From Google AI Studio

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Fill in your `.env` variables (`MONGODB_URI`, `REDIS_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`).
4. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
   *The server will run at `http://localhost:4000`.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Fill in your `.env.local` variables (`NEXT_PUBLIC_API_URL`).
4. Install dependencies and start the application:
   ```bash
   npm install
   npm run dev
   ```
   *The app will run at `http://localhost:3000`.*

---

## <img src="https://api.iconify.design/lucide:blocks.svg?color=white" width="24" height="24" align="top" /> Technology Stack Breakdown

| Technology | Role | Why this choice? |
|---|---|---|
| **Zod** | Validation | Single source of truth for runtime validation on API endpoints, preventing malformed data from reaching the database. |
| **BullMQ + Redis** | Job Queue | AI calls to Gemini can take 5–15 seconds. Pushing them to a background queue prevents HTTP timeouts, frees up the main Node thread, and allows the frontend to poll/stream progress reliably. |
| **WebSocket** | Real-Time Comm | Pushes `job:progress`, `job:completed`, and `job:failed` events directly to the browser tab that submitted the job, so the loading screen updates dynamically. |
| **Zustand** | Client State | Holds the complex multi-step assignment form data in memory (Question counts, types, time allowance). |
| **html2pdf.js** | PDF Generation | Allows perfect 1024px desktop-formatted exports directly from the client, even if the user is on mobile. |
| **JWT** | Authentication | Lightweight, stateless session management, eliminating the need for complex session stores or third-party paid auth providers. |

---

<div align="center">
  <p><b>Built with <img src="https://api.iconify.design/lucide:heart.svg?color=white" width="16" height="16" align="top" /> for Educators.</b></p>
</div>
