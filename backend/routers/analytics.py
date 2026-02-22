"""Analytics and stats API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta

from database import get_db
from models import (
    Goal, Task, DailyLog, WeeklyReport, ContentPost,
    GoalStatus, TaskStatus, GoalCategory
)
from schemas import (
    DashboardStats, TaskResponse, DailyLogCreate, DailyLogUpdate,
    DailyLogResponse, WeeklyReportResponse
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get aggregated dashboard statistics."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    # Goal stats
    total_goals = db.query(Goal).count()
    active_goals = db.query(Goal).filter(
        Goal.status.in_([GoalStatus.NOT_STARTED, GoalStatus.IN_PROGRESS])
    ).count()
    completed_goals = db.query(Goal).filter(Goal.status == GoalStatus.COMPLETED).count()
    
    # Task stats
    total_tasks = db.query(Task).count()
    tasks_today = db.query(Task).filter(Task.due_date == today).count()
    tasks_completed_today = db.query(Task).filter(
        Task.due_date == today, Task.status == TaskStatus.DONE
    ).count()
    tasks_overdue = db.query(Task).filter(
        Task.due_date < today,
        Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS])
    ).count()
    
    # Weekly completion rate
    week_tasks = db.query(Task).filter(Task.due_date >= week_start, Task.due_date <= today).count()
    week_completed = db.query(Task).filter(
        Task.due_date >= week_start, Task.due_date <= today, Task.status == TaskStatus.DONE
    ).count()
    weekly_completion_rate = (week_completed / week_tasks * 100) if week_tasks > 0 else 0.0
    
    # Streak calculation
    current_streak = _calculate_streak(db)
    
    # Today's productivity score
    today_log = db.query(DailyLog).filter(DailyLog.date == today).first()
    productivity_score = today_log.productivity_score if today_log else None
    
    # Goals by category
    goals_by_category = {}
    for cat in GoalCategory:
        count = db.query(Goal).filter(Goal.category == cat).count()
        goals_by_category[cat.value] = count
    
    # Content posts count
    content_posts_count = db.query(ContentPost).count()
    
    # Recent tasks
    recent_tasks = db.query(Task).order_by(Task.created_at.desc()).limit(5).all()
    recent_task_responses = []
    for t in recent_tasks:
        recent_task_responses.append(TaskResponse(
            id=t.id, title=t.title, description=t.description,
            goal_id=t.goal_id, priority=t.priority, quadrant=t.quadrant,
            status=t.status, due_date=t.due_date, due_time=t.due_time,
            estimated_minutes=t.estimated_minutes, actual_minutes=t.actual_minutes,
            category=t.category, is_recurring=t.is_recurring,
            recurrence_pattern=t.recurrence_pattern,
            created_at=t.created_at, completed_at=t.completed_at,
            goal_title=t.goal.title if t.goal else None,
        ))
    
    return DashboardStats(
        total_goals=total_goals,
        active_goals=active_goals,
        completed_goals=completed_goals,
        total_tasks=total_tasks,
        tasks_today=tasks_today,
        tasks_completed_today=tasks_completed_today,
        tasks_overdue=tasks_overdue,
        current_streak=current_streak,
        productivity_score=productivity_score,
        weekly_completion_rate=round(weekly_completion_rate, 1),
        goals_by_category=goals_by_category,
        recent_tasks=recent_task_responses,
        content_posts_count=content_posts_count,
    )


def _calculate_streak(db: Session) -> int:
    """Calculate consecutive days with at least one task completed."""
    today = date.today()
    streak = 0
    check_date = today
    
    while True:
        completed = db.query(Task).filter(
            Task.due_date == check_date,
            Task.status == TaskStatus.DONE
        ).count()
        if completed > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return streak


# --- Daily Logs ---

@router.get("/daily-logs", response_model=List[DailyLogResponse])
def list_daily_logs(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 30,
    db: Session = Depends(get_db),
):
    """List daily logs with optional date range."""
    query = db.query(DailyLog)
    if date_from:
        query = query.filter(DailyLog.date >= date_from)
    if date_to:
        query = query.filter(DailyLog.date <= date_to)
    logs = query.order_by(DailyLog.date.desc()).limit(limit).all()
    return [DailyLogResponse.model_validate(l) for l in logs]


@router.post("/daily-logs", response_model=DailyLogResponse, status_code=201)
def create_daily_log(log_data: DailyLogCreate, db: Session = Depends(get_db)):
    """Create or update a daily log."""
    existing = db.query(DailyLog).filter(DailyLog.date == log_data.date).first()
    if existing:
        for key, value in log_data.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return DailyLogResponse.model_validate(existing)
    
    log = DailyLog(**log_data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return DailyLogResponse.model_validate(log)


@router.put("/daily-logs/{log_date}", response_model=DailyLogResponse)
def update_daily_log(log_date: date, log_data: DailyLogUpdate, db: Session = Depends(get_db)):
    """Update a daily log by date."""
    log = db.query(DailyLog).filter(DailyLog.date == log_date).first()
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    update_data = log_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(log, key, value)
    db.commit()
    db.refresh(log)
    return DailyLogResponse.model_validate(log)


# --- Weekly Reports ---

@router.get("/weekly-reports", response_model=List[WeeklyReportResponse])
def list_weekly_reports(limit: int = 10, db: Session = Depends(get_db)):
    """List weekly reports."""
    reports = db.query(WeeklyReport).order_by(WeeklyReport.week_start.desc()).limit(limit).all()
    return [WeeklyReportResponse.model_validate(r) for r in reports]


@router.get("/weekly-reports/{report_id}", response_model=WeeklyReportResponse)
def get_weekly_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific weekly report."""
    report = db.query(WeeklyReport).filter(WeeklyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return WeeklyReportResponse.model_validate(report)
