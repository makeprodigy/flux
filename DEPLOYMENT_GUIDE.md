# Flux Production Deployment Guide

This guide walks you through deploying **Flux** to production using the most reliable, free-tier friendly modern stack: **Vercel** (Frontend), **Render** (Backend), **MongoDB Atlas** (Database), and **Upstash** (Redis).

---

## Step 1: Database Setup (MongoDB Atlas & Upstash)

Before deploying your servers, you need your databases hosted on the cloud.

### 1. MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free cluster.
2. Create a Database User (give it a username and password).
3. Under **Network Access**, click "Add IP Address" and select **"Allow Access from Anywhere"** (`0.0.0.0/0`). This is necessary so Render can connect to it.
4. Click **Connect**, choose "Connect your application", and copy the connection string.
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
   - **Important:** Replace `<username>` and `<password>` with the credentials you just created. Save this string.

### 2. Upstash (Redis)
Render's free Redis expires after 90 days, so Upstash is the standard for free production Redis.
1. Go to [Upstash](https://upstash.com/) and create a free Redis database.
2. Scroll down to the **Node.js** connection code to get your Redis connection details. You'll usually get a Host URL and a Port (e.g., `primary-region-name.upstash.io` and `30000`).

---

## Step 2: Backend Deployment (Render)

We will deploy the Node.js Express backend to [Render.com](https://render.com/).

1. Go to Render and click **New+** -> **Web Service**.
2. Connect your GitHub account and select the `assignment_flux` repository.
3. Configure the Web Service:
   - **Name:** `flux-backend` (or whatever you prefer)
   - **Root Directory:** `backend` *(Crucial!)*
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free (or whatever you prefer)
4. Scroll down to **Environment Variables** and add the following:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `FRONTEND_URL` | *(Leave blank for now, we will update this after Vercel deployment!)* |
| `MONGODB_URI` | *Paste your MongoDB Atlas connection string here* |
| `REDIS_HOST` | *e.g., `humble-narwhal-134636.upstash.io` (Do NOT include https://)* |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | *Paste your Upstash password/token here* |
| `JWT_SECRET` | *Type any long random string (e.g., `flux_prod_secret_9942`)* |
| `JWT_EXPIRES_IN` | `7d` |
| `GEMINI_API_KEY` | *Your Google Gemini API Key* |

5. Click **Create Web Service**. Wait a few minutes for it to build and deploy. Once it's live, copy the Render URL (e.g., `https://flux-backend.onrender.com`).

---

## Step 3: Frontend Deployment (Vercel)

We will deploy the Next.js frontend to [Vercel](https://vercel.com/), which is built specifically for Next.js and is incredibly fast.

1. Go to Vercel and click **Add New** -> **Project**.
2. Connect your GitHub account and import the `assignment_flux` repository.
3. Configure the Project:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Edit this and select `frontend` *(Crucial!)*
   - **Build Command:** *(Leave default, Vercel handles this)*
4. Open the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | *Paste your Render Backend URL here (e.g., `https://flux-backend.onrender.com`)* |

5. Click **Deploy**. Vercel will build and launch your frontend in a minute or two.
6. Once deployed, copy your final Vercel Domain (e.g., `https://flux-frontend.vercel.app`).

---

## Step 4: Final Linkup

Right now, your backend is running, but it might reject requests from your frontend because of CORS (Cross-Origin Resource Sharing). We need to tell the backend to trust your Vercel URL.

1. Go back to your **Render Web Service** dashboard.
2. Go to **Environment**.
3. Add or update the `FRONTEND_URL` variable:
   - **Value:** *Paste your Vercel URL here (e.g., `https://flux-frontend.vercel.app`)*. **Make sure there is NO trailing slash at the end of the URL!**
4. Save the changes. Render will automatically redeploy the backend with the new allowed URL.

---

### 🎉 You're Done!
Once the backend finishes its final restart, go to your Vercel URL. You should be able to create an account, log in, generate assignments, and download PDFs completely live on the internet!
