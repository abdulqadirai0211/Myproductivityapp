# ⚡ MyTracker — AI-Powered Productivity Platform

An intelligent productivity platform that doesn't just track goals and tasks — it **analyzes your patterns**, **identifies weaknesses**, **prioritizes work**, **generates reports**, and **researches income opportunities** using AI agents.

![Dashboard](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square) ![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square) ![AI](https://img.shields.io/badge/AI-LangChain%20%2B%20Groq-FF6F00?style=flat-square)

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **🎯 Goal Tracking** | Daily/weekly/monthly/yearly goals with progress sliders & color coding |
| **📋 Task Management** | List, calendar, and priority views with full CRUD |
| **📅 Calendar** | Monthly calendar with task indicators and click-to-add |
| **🤖 AI Prioritizer** | Eisenhower matrix task classification via Groq LLM |
| **📝 Markdown Notes** | Create, edit, search, and pin notes in markdown |
| **✍️ AI Note Assistant** | Create, expand, summarize, and organize notes with AI |
| **📊 Daily Logging** | Track mood, energy, focus hours, and productivity score |
| **📈 Weekly Reports** | AI-generated comprehensive weekly summaries |
| **🧠 Productivity Analysis** | AI identifies patterns, strengths, and weaknesses |
| **💰 Income Research** | AI suggests earning and learning opportunities |
| **💬 AI Chat** | General productivity coach chat |

---

## 🏗️ Architecture

```
mytracker/
├── docker-compose.yml
├── backend/                     # FastAPI + LangChain + Groq
│   ├── main.py                  # App entry point
│   ├── database.py              # SQLAlchemy config (SQLite)
│   ├── models.py                # 5 DB models
│   ├── schemas.py               # Pydantic schemas
│   ├── Dockerfile
│   ├── routers/
│   │   ├── goals.py             # Goals CRUD API
│   │   ├── tasks.py             # Tasks CRUD + calendar API
│   │   ├── notes.py             # Notes CRUD API
│   │   ├── analytics.py         # Stats, daily logs, weekly reports
│   │   └── ai.py                # AI agent endpoints
│   ├── agents/
│   │   ├── productivity_agent.py
│   │   ├── prioritizer_agent.py
│   │   ├── report_agent.py
│   │   ├── research_agent.py
│   │   └── note_agent.py
│   └── services/
│       ├── llm_service.py       # Shared LangChain + Groq setup
│       └── analytics_service.py # DB analytics computations
└── frontend/                    # React + Vite
    ├── Dockerfile
    └── src/
        ├── api/client.js        # Axios API client
        ├── components/
        │   └── Sidebar.jsx      # Navigation sidebar
        └── pages/
            ├── Dashboard.jsx    # Stats, tasks, AI insights
            ├── Goals.jsx        # Goal management + progress
            ├── Tasks.jsx        # List, calendar, priority views
            ├── Notes.jsx        # Markdown notes + AI assist
            └── Analytics.jsx    # Reports, analysis, research
```

---

## ⚡ Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- [Groq API Key](https://console.groq.com) (free)

### Local Development

```bash
# 1. Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env → add your GROQ_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

### 🐳 Docker Compose

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env → add your GROQ_API_KEY

# 2. Build and run both services
docker compose up --build -d

# 3. Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

To stop:
```bash
docker compose down
```

---

## 🤖 AI Agents

All AI agents use **Llama 3.3 70B** via **Groq** for fast, free inference.

| Agent | Endpoint | Purpose |
|-------|----------|---------|
| Productivity Analyzer | `POST /api/ai/analyze` | Analyze patterns, find weaknesses |
| Task Prioritizer | `POST /api/ai/prioritize` | Eisenhower matrix, suggest what to ignore |
| Report Generator | `POST /api/ai/report` | Generate weekly productivity reports |
| Income Researcher | `POST /api/ai/research` | Find earning & learning opportunities |
| Note Assistant | `POST /api/ai/note-assist` | Create, expand, summarize markdown notes |
| Chat | `POST /api/ai/chat` | General productivity coaching |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router, Axios, React Markdown |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | SQLite (zero-config, portable) |
| **AI/LLM** | LangChain, LangGraph, Groq (Llama 3.3 70B) |
| **Deployment** | Docker, Docker Compose |

---

## 📄 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key for AI features | Yes |
| `DATABASE_URL` | SQLite database path (default: `sqlite:///./mytracker.db`) | No |

---

## 📜 License

MIT
