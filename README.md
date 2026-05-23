<div align="center">
  <img src="https://raw.githubusercontent.com/makeprodigy/assignment_veda/main/frontend/public/logo.svg" alt="VedaAI Logo" width="80" height="80" onerror="this.src='https://cdn-icons-png.flaticon.com/512/4712/4712139.png'">
  <h1 align="center">VedaAI Assessment Creator</h1>
  <p align="center">
    <strong>An AI-powered assessment creation platform for teachers</strong>
    <br/>
    A full-stack application that allows teachers to create custom assignments, generate structured question papers using AI, and view the output in real-time.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-cyan?logo=tailwind-css" alt="Tailwind CSS" />
    <br/>
    <img src="https://img.shields.io/badge/Express.js-Node.js-green?logo=node.js" alt="Express" />
    <img src="https://img.shields.io/badge/BullMQ-Queue-red" alt="BullMQ" />
    <img src="https://img.shields.io/badge/Redis-Cache-red?logo=redis" alt="Redis" />
    <img src="https://img.shields.io/badge/Live_Demo-Vercel-black?logo=vercel" alt="Live Demo" />
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

Built as a Full Stack Engineering Assignment, **VedaAI** is an AI Assessment Creator based on provided Figma designs. The system empowers teachers to:
- Create assignments effortlessly.
- Generate high-quality question papers using AI.
- View, regenerate, and download the generated output.

Figma Designs: [AI Assessment Creator](https://www.figma.com/design/nB2HMm1BhTpmHcHrmEslGB/VedaAI---Hiring-Assignment?node-id=0-1&t=UjYQLgEek4u99AA4-1)

---

## 💻 Frontend System (Assignment Creation)

Using the Figma designs, the frontend provides a seamless form for teachers to create assessments.

### Features
- **Form Inputs:** Due date, Question types, Number of questions, Marks, and Additional instructions.
- **File Upload:** Attach contextual documents (PDF/Text) to guide the AI.
- **Validation:** Strict validation to prevent empty or negative values.
- **State Management:** Utilizing Zustand for robust, lightweight state management.
- **Real-time UX:** Websocket integration to display live generation progress.

---

## ⚙️ Backend System

A robust Node.js + Express (TypeScript) architecture designed for reliability and speed.

### Flow
1. **API Request:** Frontend submits assignment criteria.
2. **Job Queueing:** Job is immediately added to **BullMQ**.
3. **Background Processing:** Worker safely processes generation via AI.
4. **Storage:** Result is stored in **MongoDB**.
5. **Real-time Notify:** Server broadcasts completion back to Frontend via **WebSocket**.

### Stack
- **Database:** MongoDB (stores assignments & results)
- **Caching:** Redis (stores results for fast retrieval and manages job states)
- **Background Jobs:** BullMQ
- **Live Updates:** WebSocket (`ws`)

---

## 🧠 AI Question Generation

The core engine powered by Google Gemini 2.5 Flash, carefully structured to prevent raw LLM spillage.

### Requirements Met
- **Prompt Engineering:** Converts user inputs into highly structured prompts.
- **Structured Output:** Automatically generates segmented Sections (e.g., A, B), individual Questions, categorized Difficulty (Easy/Moderate/Hard), and precise Marks.
- **No Raw LLMs:** Strictly parses and validates the output (via Zod) rather than directly rendering the LLM text.

---

## 📄 Output Page (Enhanced)

Displays the generated question paper in a well-designed, exam-ready format.

### Elements
- **Student Info Section:** Clean input lines for Name, Roll Number, and Section.
- **Question Sections:** Groups questions by section with specific instructions (e.g., "Attempt all questions").
- **Question Details:** Each question elegantly displays the question text, a visual Difficulty badge, and total marks.

### UX & Bonus Features
- Clean, highly readable layout imitating real-world exam papers.
- Mobile responsive.
- **PDF Export:** Proper formatting for a high-quality A4 PDF download.
- **Action Bar:** "Regenerate" functionality with live progress updates.

---

## 🏗️ Architecture

```text
VedaAI/
├── frontend/          # Next.js 15 + TypeScript + Zustand + Tailwind CSS
├── backend/           # Node.js + Express + TypeScript + BullMQ + Mongoose
├── docker-compose.yml # MongoDB 7 + Redis 7
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
