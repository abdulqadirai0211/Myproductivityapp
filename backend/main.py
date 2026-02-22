"""MyTracker — AI-Powered Productivity Platform Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import goals, tasks, notes, analytics, ai, categories

app = FastAPI(
    title="MyTracker API",
    description="AI-Powered Productivity Platform — Track, Analyze, Prioritize, Grow",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(goals.router)
app.include_router(tasks.router)
app.include_router(notes.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(categories.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "name": "MyTracker API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
