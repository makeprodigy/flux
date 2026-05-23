<div align="center">
  <h1 align="center">VedaAI Assessment Creator</h1>
  <p align="center">
    <strong>An AI-powered assessment creation platform for teachers</strong>
    <br/>
    A full-stack application that allows teachers to create custom assignments, generate structured question papers using AI, and view the output in real-time.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-cyan?logo=tailwind-css" alt="Tailwind CSS" />
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

  <p align="center">
    <a href="https://assignment-veda.vercel.app/">Live Demo</a>
    ·
    <a href="#architecture">Architecture</a>
    ·
    <a href="#quick-start">Quick Start</a>
  </p>
</div>

---

## 🎯 Overview

Built as a Full Stack Engineering Assignment, **VedaAI** is a complete, production-ready AI Assessment Creator. 

### Key Capabilities:
- **Instant Assignment Generation:** Empowers teachers to generate high-quality question papers in seconds using AI.
- **Premium UX:** Faithfully implements and elevates the provided Figma designs with micro-animations, glassmorphism, and custom UI elements.
- **Robust Infrastructure:** Decoupled backend architecture utilizing background workers and WebSockets for a seamless, unblocking experience.

---

## 💻 Frontend System (Assignment Creation)

The frontend is highly responsive and designed to provide a frictionless, modern user experience.

### Core Implementation:
- **State Management:** Utilizes `Zustand` for lightweight, scalable global state handling across complex form inputs (Question counts, types, time allowance, etc.).
- **Custom UI Components:** Replaced native OS dropdowns with sleek, custom-built Select components and intuitive drag-and-drop file upload zones.
- **Strict Validation:** Ensures data integrity by blocking empty fields and negative marks/counts before submission.
- **Real-Time Progress (WebSockets):** The moment an assignment is queued, the UI connects to a WebSocket server, displaying live toast notifications reflecting the AI's exact progress (e.g., "Connecting to AI... 35%").

---

## ⚙️ Backend System

A robust Node.js + Express (TypeScript) architecture engineered for reliability, speed, and asynchronous processing.

### Architecture Flow:
- **Job Queuing (BullMQ):** Heavy LLM requests are offloaded to a BullMQ worker to prevent API blocking. A pending record is immediately saved in **MongoDB Atlas**.
- **Caching Layer (Upstash Redis):** Generated question papers are aggressively cached for 1 hour. Reloading the result page serves the paper instantly from memory.
- **Live Notifications:** As the BullMQ worker processes the generation, it emits live progress updates to a custom WebSocket (`ws`) server, which instantly broadcasts them to the connected frontend client.
- **Cloud Deployment:** Hosted securely and efficiently on **Render**.

---

## 🧠 AI Question Generation

The core generation engine is powered by **Google Gemini 2.5 Flash**, with strict deterministic guardrails.

### AI Implementation Details:
- **Prompt Engineering:** Prompts are meticulously structured to prevent raw LLM spillage.
- **JSON Schema Enforcement:** Gemini is strictly instructed to return a structured JSON response matching our internal `QuestionPaper` interface.
- **Automated Categorization:** The background worker parses the JSON to automatically group questions into logical Sections (A, B, etc.) and tags them with proper Difficulties (Easy/Moderate/Hard).
- **Error Resilience:** Invalid JSON structures or API failures are safely caught, instantly notifying the frontend to display an error state without crashing the app.

---

## 📄 Output Page (Enhanced)

The output view replicates a professional, real-world exam paper with a high degree of UI polish.

### Key Features:
- **Structured Exam Layout:** Includes a Top Header (School Name, Time Allowed), a Student Info section (Name, Roll No., Section), and aligned Question Sections with specific instructions.
- **Visual Difficulty Badges:** Questions dynamically render color-coded difficulty tags (Green for Easy, Yellow for Moderate, Red for Hard).
- **Desktop-Caliber PDF Export:** Uses `html2pdf.js` with a hardcoded internal viewport width (1024px). This guarantees the downloaded A4 PDF maintains perfect desktop formatting and margins, even if downloaded from a mobile device.
- **Seamless Regeneration Flow:** Includes an intuitive "Regenerate" button that fires a new background job and effortlessly transitions the user through the live WebSocket loading flow to the new paper.

---

## 📁 Folder Structure

```text
VedaAI/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API logic (Assignments, Auth, Results)
│   │   ├── models/           # Mongoose Schemas (User, Assignment, Result)
│   │   ├── queues/           # BullMQ queues and workers for AI background jobs
│   │   ├── routes/           # Express router endpoints
│   │   ├── services/         # Gemini AI Service, Redis caching, PDF generator
│   │   ├── types/            # TypeScript interfaces and definitions
│   │   └── index.ts          # Express & WebSocket server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router (Dashboard, Create, Output)
│   │   ├── components/       # Reusable UI components (CustomSelect, Layout)
│   │   ├── hooks/            # Custom React hooks (e.g., usePdfExport)
│   │   ├── lib/              # Axios API client and WebSocket handlers
│   │   ├── store/            # Zustand global state stores (Auth, Jobs)
│   │   └── types/            # Shared TypeScript types
│   ├── public/               # Static assets
│   ├── .env.local.example
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml        # Infrastructure setup (MongoDB 7 + Redis 7)
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Google Gemini API key

### 1. Clone & Setup
```bash
git clone https://github.com/makeprodigy/assignment_veda.git
cd assignment_veda
```

### 2. Start Infrastructure
```bash
docker-compose up -d
# MongoDB on :27017, Redis on :6379
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY
npm run dev
# Backend running on http://localhost:4000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# Frontend running on http://localhost:3000
```
