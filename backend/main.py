"""MyTracker — AI-Powered Productivity Platform Backend."""

import logging
import sys
import time
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import goals, tasks, notes, analytics, ai, categories, habits, standups, income, timeblocks

# --- Logging Setup ---
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s"
DATE_FORMAT = "%H:%M:%S"

logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=DATE_FORMAT,
    stream=sys.stdout,
    force=True,
)

# Quiet noisy libraries
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

logger = logging.getLogger("mytracker.app")

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


# --- Request Logging Middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request with method, path, duration, and status."""
    start = time.time()
    method = request.method
    path = request.url.path

    # Skip noisy OPTIONS preflight
    if method == "OPTIONS":
        return await call_next(request)

    logger.info(f"➡️  {method} {path}")

    response = await call_next(request)

    duration_ms = (time.time() - start) * 1000
    status = response.status_code
    emoji = "✅" if status < 400 else "⚠️" if status < 500 else "❌"

    logger.info(f"{emoji}  {method} {path} → {status} ({duration_ms:.0f}ms)")
    return response


# Include routers
app.include_router(goals.router)
app.include_router(tasks.router)
app.include_router(notes.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(categories.router)
app.include_router(habits.router)
app.include_router(standups.router)
app.include_router(income.router)
app.include_router(timeblocks.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    logger.info("=" * 60)
    logger.info("⚡ MyTracker API v1.0.0 starting up...")
    logger.info("=" * 60)
    init_db()
    logger.info("✅ Database initialized")
    logger.info("📡 CORS: localhost:5173, localhost:3000")
    logger.info("🤖 AI Agents: productivity, prioritizer, report, research, content, notes")
    logger.info("🔍 DuckDuckGo search: enabled for content suggestions")
    logger.info(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)


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

