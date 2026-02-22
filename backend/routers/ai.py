"""AI Agent API router — exposes all AI agent endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta

from database import get_db
from models import WeeklyReport
from schemas import AIRequest, AIResponse
from services.analytics_service import (
    get_productivity_data,
    get_tasks_for_prioritization,
    get_weekly_summary_data,
    get_user_profile_for_research,
)
from agents.productivity_agent import analyze_productivity
from agents.prioritizer_agent import prioritize_tasks
from agents.report_agent import generate_weekly_report
from agents.research_agent import research_income_opportunities
from agents.note_agent import assist_with_note

router = APIRouter(prefix="/api/ai", tags=["AI Agents"])


@router.post("/analyze", response_model=AIResponse)
async def ai_analyze(request: AIRequest, db: Session = Depends(get_db)):
    """Analyze productivity patterns and identify weaknesses."""
    try:
        data = get_productivity_data(db, days=30)
        response = await analyze_productivity(data, request.prompt or "")
        return AIResponse(response=response, agent="productivity_analyzer")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.post("/prioritize", response_model=AIResponse)
async def ai_prioritize(request: AIRequest, db: Session = Depends(get_db)):
    """Prioritize tasks using Eisenhower Matrix."""
    try:
        tasks = get_tasks_for_prioritization(db)
        response = await prioritize_tasks(tasks, request.prompt or "")
        return AIResponse(response=response, agent="task_prioritizer")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI prioritization failed: {str(e)}")


@router.post("/report", response_model=AIResponse)
async def ai_report(request: AIRequest, db: Session = Depends(get_db)):
    """Generate a weekly productivity report."""
    try:
        data = get_weekly_summary_data(db)
        report_content = await generate_weekly_report(data)
        
        # Save the report to database
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        report = WeeklyReport(
            week_start=week_start,
            week_end=week_end,
            report_content=report_content,
            goals_progress="",
            tasks_summary="",
            insights=report_content,
        )
        db.add(report)
        db.commit()
        
        return AIResponse(response=report_content, agent="report_generator")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.post("/research", response_model=AIResponse)
async def ai_research(request: AIRequest, db: Session = Depends(get_db)):
    """Research income and learning opportunities."""
    try:
        user_data = get_user_profile_for_research(db)
        response = await research_income_opportunities(user_data, request.prompt or "")
        return AIResponse(response=response, agent="income_researcher")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@router.post("/note-assist", response_model=AIResponse)
async def ai_note_assist(request: AIRequest, db: Session = Depends(get_db)):
    """AI-assisted note creation and enhancement.
    
    Use the prompt field to specify the action:
    - "create: <topic>" — create a new note
    - "expand: <content>" — expand existing content
    - "summarize: <content>" — summarize content
    - "organize: <content>" — reorganize messy notes
    - "template: <type>" — generate a note template
    - Or just ask anything about notes
    """
    try:
        prompt = request.prompt or ""
        context = request.context or ""
        
        # Parse action from prompt
        action = "create"
        topic = prompt
        content = context
        
        if prompt.lower().startswith("create:"):
            action = "create"
            topic = prompt[7:].strip()
        elif prompt.lower().startswith("expand:"):
            action = "expand"
            content = prompt[7:].strip() + ("\n" + context if context else "")
        elif prompt.lower().startswith("summarize:"):
            action = "summarize"
            content = prompt[10:].strip() + ("\n" + context if context else "")
        elif prompt.lower().startswith("organize:"):
            action = "organize"
            content = prompt[9:].strip() + ("\n" + context if context else "")
        elif prompt.lower().startswith("template:"):
            action = "template"
            topic = prompt[9:].strip()
        
        response = await assist_with_note(
            action=action,
            content=content,
            topic=topic,
            user_prompt=prompt,
        )
        return AIResponse(response=response, agent="note_assistant")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Note assistance failed: {str(e)}")


@router.post("/chat", response_model=AIResponse)
async def ai_chat(request: AIRequest, db: Session = Depends(get_db)):
    """General AI chat about productivity, goals, and motivation."""
    try:
        from services.llm_service import quick_llm_call
        
        # Gather context
        data = get_productivity_data(db, days=7)
        
        system_prompt = """You are MyTracker AI, a friendly and motivating productivity assistant.
You have access to the user's productivity data and can help with:
- Goal setting and tracking advice
- Time management tips
- Motivation and accountability
- Study and learning strategies
- Work-life balance
- Answering questions about their progress

Be conversational, encouraging, and practical. Use emojis sparingly.
Format responses in clean markdown."""
        
        user_message = f"""User's recent stats (last 7 days): 
- Tasks: {data['completed_tasks']}/{data['total_tasks']} completed ({data['completion_rate']}%)
- Active goals: {len(data['active_goals'])}
- Overdue: {data['overdue_tasks']} tasks

User says: {request.prompt}"""
        
        response = await quick_llm_call(system_prompt, user_message)
        return AIResponse(response=response, agent="chat_assistant")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/content-suggest", response_model=AIResponse)
async def ai_content_suggest(request: AIRequest, db: Session = Depends(get_db)):
    """Suggest content topics to post on LinkedIn, Medium, Reels based on learnings and AI/ML trends."""
    try:
        from agents.content_agent import suggest_content
        user_data = get_user_profile_for_research(db)

        # Also gather category items to know what the user is learning/building
        from models import TaskCategory, CategoryItem, ContentPost
        categories = db.query(TaskCategory).all()
        cat_data = []
        for c in categories:
            items = [{"title": i.title, "status": i.status, "phase": i.phase} for i in c.items]
            cat_data.append({"name": c.name, "items": items})
        user_data["categories"] = cat_data

        # Recent content posts
        recent_posts = db.query(ContentPost).order_by(ContentPost.created_at.desc()).limit(10).all()
        user_data["recent_posts"] = [
            {"platform": p.platform, "title": p.title, "topic": p.topic, "status": p.status}
            for p in recent_posts
        ]

        response = await suggest_content(user_data, request.prompt or "")
        return AIResponse(response=response, agent="content_suggester")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content suggestion failed: {str(e)}")

