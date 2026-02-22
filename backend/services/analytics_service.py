"""Analytics service for computing stats from the database."""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta, datetime
from typing import Dict, List, Any
import json

from models import Goal, Task, Note, DailyLog, TaskStatus, GoalStatus, GoalCategory


def get_productivity_data(db: Session, days: int = 30) -> Dict[str, Any]:
    """Gather comprehensive productivity data for AI analysis."""
    today = date.today()
    start_date = today - timedelta(days=days)
    
    # Task completion data
    tasks = db.query(Task).filter(Task.due_date >= start_date).all()
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.DONE)
    overdue_tasks = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today
        and t.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS)
    )
    skipped_tasks = sum(1 for t in tasks if t.status == TaskStatus.SKIPPED)
    
    # Task completion by day of week
    completion_by_day = {i: {"total": 0, "completed": 0} for i in range(7)}
    for t in tasks:
        if t.due_date:
            dow = t.due_date.weekday()
            completion_by_day[dow]["total"] += 1
            if t.status == TaskStatus.DONE:
                completion_by_day[dow]["completed"] += 1
    
    # Task categories breakdown
    category_stats = {}
    for t in tasks:
        cat = t.category or "general"
        if cat not in category_stats:
            category_stats[cat] = {"total": 0, "completed": 0}
        category_stats[cat]["total"] += 1
        if t.status == TaskStatus.DONE:
            category_stats[cat]["completed"] += 1
    
    # Goal progress
    goals = db.query(Goal).filter(
        Goal.status.in_([GoalStatus.NOT_STARTED, GoalStatus.IN_PROGRESS])
    ).all()
    goal_data = []
    for g in goals:
        task_count = len(g.tasks)
        done_count = sum(1 for t in g.tasks if t.status == TaskStatus.DONE)
        goal_data.append({
            "title": g.title,
            "category": g.category.value,
            "progress": g.progress,
            "target_date": g.target_date.isoformat() if g.target_date else None,
            "task_total": task_count,
            "task_done": done_count,
        })
    
    # Daily logs
    logs = db.query(DailyLog).filter(DailyLog.date >= start_date).order_by(DailyLog.date).all()
    log_data = [
        {
            "date": l.date.isoformat(),
            "productivity_score": l.productivity_score,
            "mood": l.mood,
            "energy_level": l.energy_level,
            "tasks_completed": l.tasks_completed,
            "tasks_total": l.tasks_total,
            "focus_hours": l.focus_hours,
        }
        for l in logs
    ]
    
    # Time estimation accuracy
    tasks_with_estimates = [t for t in tasks if t.estimated_minutes and t.actual_minutes]
    avg_estimation_accuracy = None
    if tasks_with_estimates:
        accuracies = [t.actual_minutes / t.estimated_minutes for t in tasks_with_estimates]
        avg_estimation_accuracy = sum(accuracies) / len(accuracies)
    
    return {
        "period_days": days,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks else 0,
        "overdue_tasks": overdue_tasks,
        "skipped_tasks": skipped_tasks,
        "completion_by_day_of_week": completion_by_day,
        "category_stats": category_stats,
        "active_goals": goal_data,
        "daily_logs": log_data,
        "avg_estimation_accuracy": avg_estimation_accuracy,
    }


def get_tasks_for_prioritization(db: Session) -> List[Dict[str, Any]]:
    """Get pending tasks for AI prioritization."""
    tasks = db.query(Task).filter(
        Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS])
    ).order_by(Task.due_date.asc().nullslast()).all()
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "priority": t.priority.value if t.priority else "medium",
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "category": t.category,
            "estimated_minutes": t.estimated_minutes,
            "goal_title": t.goal.title if t.goal else None,
            "is_overdue": t.due_date < date.today() if t.due_date else False,
        }
        for t in tasks
    ]


def get_weekly_summary_data(db: Session) -> Dict[str, Any]:
    """Get data for weekly report generation."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    # Tasks this week
    tasks = db.query(Task).filter(
        Task.due_date >= week_start, Task.due_date <= week_end
    ).all()
    
    completed = [t for t in tasks if t.status == TaskStatus.DONE]
    pending = [t for t in tasks if t.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS)]
    skipped = [t for t in tasks if t.status == TaskStatus.SKIPPED]
    
    # Goals progress
    goals = db.query(Goal).filter(
        Goal.status.in_([GoalStatus.NOT_STARTED, GoalStatus.IN_PROGRESS])
    ).all()
    
    # Daily logs this week
    logs = db.query(DailyLog).filter(
        DailyLog.date >= week_start, DailyLog.date <= week_end
    ).all()
    
    avg_productivity = None
    if logs:
        scores = [l.productivity_score for l in logs if l.productivity_score is not None]
        avg_productivity = sum(scores) / len(scores) if scores else None
    
    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "total_tasks": len(tasks),
        "completed_tasks": len(completed),
        "pending_tasks": len(pending),
        "skipped_tasks": len(skipped),
        "completed_task_titles": [t.title for t in completed],
        "pending_task_titles": [t.title for t in pending],
        "goals": [
            {"title": g.title, "progress": g.progress, "category": g.category.value}
            for g in goals
        ],
        "avg_productivity_score": avg_productivity,
        "daily_logs": [
            {"date": l.date.isoformat(), "mood": l.mood, "energy": l.energy_level, "focus_hours": l.focus_hours}
            for l in logs
        ],
    }


def get_user_profile_for_research(db: Session) -> Dict[str, Any]:
    """Gather user profile data for income/learning research."""
    goals = db.query(Goal).all()
    notes = db.query(Note).all()
    tasks = db.query(Task).all()
    
    # Extract skills and interests from goals and notes
    all_tags = set()
    for n in notes:
        if n.tags:
            for tag in n.tags.split(","):
                tag = tag.strip()
                if tag:
                    all_tags.add(tag)
    
    categories = set(t.category for t in tasks if t.category)
    goal_titles = [g.title for g in goals]
    
    return {
        "goal_titles": goal_titles,
        "note_tags": list(all_tags),
        "task_categories": list(categories),
        "total_notes": len(notes),
        "total_goals": len(goals),
    }
