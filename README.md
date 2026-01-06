Dejaview AI-Powered Semantic Journal

Dejaview is an AI-powered personal journaling application that allows users to write journals and converse with their past thoughts using natural language.
It leverages semantic search, vector similarity, and large language models to transform personal journals into an interactive, context-aware experience.

Built using a Retrieval-Augmented Generation (RAG) architecture, Dejaview retrieves relevant journal entries using FAISS and generates grounded responses using a large language model.

✨ Features

Multi-User Authentication
Secure user authentication allowing each user to maintain a private, isolated journal space.

Personal Journaling
Write, store, and manage journal entries securely in PostgreSQL.

Semantic Journal Search
Retrieve relevant journal entries using vector similarity instead of keyword matching.

Conversational AI Interface
Talk to your journal using natural language queries and receive responses grounded in your own entries.

RAG-Based Architecture
Uses FAISS for vector retrieval and LLaMA-3.3-70B-Versatile for response generation.

Context-Aware Conversations
Maintains chat history to provide coherent follow-up responses.

Dockerized Backend Services
Containerized FastAPI services for reproducible ML inference and reliable deployment.

🧠 System Architecture
┌──────────────┐
│  Next.js UI  │
│ (Auth + UI)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Node.js API  │──────────▶ PostgreSQL
│ (Auth + CRUD)             (User Journals)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ FastAPI Vector API   │
│ (Embeddings + FAISS) │
└──────┬───────────────┘
       │
       ▼
┌──────────────┐
│  LLaMA 3.3   │
│  Generation  │
└──────────────┘

🔍 How It Works
1. Authentication & Journal Storage

Users authenticate via the Next.js + Node.js backend.

Journal entries are stored securely in PostgreSQL, scoped per user.

2. Embedding & Vector Indexing

Journal entries are embedded using BGE (BAAI/bge-small-en-v1.5).

Vectors are stored and indexed using FAISS with disk persistence.

3. Semantic Retrieval

User queries are embedded and searched against FAISS to retrieve the top-k most relevant journal entries.

4. Response Generation (RAG)

Retrieved journal entries are injected as context.

LLaMA-3.3-70B-Versatile generates responses grounded in user-owned data.

5. Conversational Memory

Recent chat history is preserved to maintain conversational continuity.

🛠️ Tech Stack
Frontend

Framework: Next.js (React 18)

Language: JavaScript / JSX

Styling: Tailwind CSS

UI Components: Radix UI

Icons: Lucide React

Backend

Auth & Journals API: Node.js

Vector Search API: FastAPI

Embeddings: fastembed (BGE Small EN v1.5)

Vector Database: FAISS (local persistent index)

Database: PostgreSQL

LLM: LLaMA-3.3-70B-Versatile

Infrastructure

Containerization: Docker

Deployment: Dockerized services

Vector Storage: FAISS (local, disk-persisted)

📁 Project Structure
dejaview/
├── frontend/
│   ├── app/
│   ├── components/
│   └── auth/
├── backend/
│   ├── journal-api/        # Node.js (Auth + Journals)
│   └── vector-api/
│       ├── main.py         # FastAPI FAISS service
│       ├── requirements.txt
│       └── index.bin       # Persistent FAISS index
├── docker-compose.yml
└── README.md

🐳 Docker & Deployment

Backend services are fully Dockerized.

Docker ensures:

Environment consistency

Reproducible ML inference

Reliable deployment on free-tier infrastructure

Simplifies dependency management for FAISS and embedding models.

🔐 Privacy & Data Isolation

Each user’s journals are logically isolated.

No third-party analytics or tracking.

Journal content is only used to generate user-specific responses.

📜 License

MIT License

🤝 Contributing

Contributions are welcome.
Feel free to open an issue or submit a pull request.

🚀 Future Improvements

Cloud-hosted vector database (optional scaling)

Advanced journal analytics

Emotion-aware reflections

Multi-device sync

