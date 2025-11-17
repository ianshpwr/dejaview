# 🧠 DejaView — Memory Journal with AI Recall

> “Rediscover your past, understand your emotions, and reflect meaningfully — powered by AI.”

---

## 🪞 Overview

**DejaView** is a modern **AI-powered journaling platform** that helps users **record, recall, and reflect** on their personal experiences.  
Unlike traditional journals, DejaView uses **semantic search** and **AI reflections** to help users explore past entries through meaning, not just keywords.

---

## 💡 Problem Statement

People often struggle to recall meaningful memories, emotions, or insights from their journals.  
DejaView bridges this gap by combining **AI-based semantic recall** and **emotional reflection**, allowing users to rediscover experiences like *“When was I happiest?”* or *“What stressed me most last month?”*.

---

## 🧩 System Architecture


| Layer | Technologies |
|-------|---------------|
| **Frontend** | Next.js, TailwindCSS (for reactive, modern UI) |
| **Backend** | Node.js, Express.js (RESTful API) |
| **Database** | PostgreSQL (secure relational storage) |
| **AI Layer** | Gemini / Groq API (semantic recall + mood reflections) |
| **Authentication** | JWT-based secure login |
| **Hosting** | Frontend → Vercel, Backend → Render, Database → Aiven |

---

## ✨ Key Features

| Category | Features |
|-----------|-----------|
| 🧍‍♂️ **Authentication & Authorization** | Secure user signup, login, and logout using JWT |
| 📔 **Journal Management** | Create, edit, and delete daily journal entries with mood tagging |
| 🧠 **AI Insights** | AI-generated summaries and emotional reflections |
| 🔍 **Vector Search** | Semantic memory search (e.g., “When was I happiest?”) |
| 🔐 **Encryption & Privacy** | Fully private, encrypted data storage |
| ☁️ **Hosting** | Deployed on Vercel (frontend) and Render (backend) |

---

## 🧰 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | Next.js, TailwindCSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT |
| **AI Integration** | Gemini / Groq API |
| **Hosting** | Vercel, Render, Aiven |

---

## ⚙️ API Overview

| Endpoint | Method | Description | Access |
|-----------|--------|-------------|---------|
| `/api/auth/signup` | **POST** | Register a new user | Public |
| `/api/auth/login` | **POST** | Authenticate user | Public |
| `/api/journal` | **GET** | Retrieve all journal entries | Authenticated |
| `/api/journal` | **POST** | Create a new journal entry | Authenticated |
| `/api/journal/:id` | **PUT** | Update an existing journal entry | Authenticated |
| `/api/journal/:id` | **DELETE** | Delete a journal entry | Authenticated |
| `/api/ai/reflect` | **POST** | Generate AI reflection from journal entries | Authenticated |

---

## 🏗️ Project Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/dejaview.git
cd dejaview
