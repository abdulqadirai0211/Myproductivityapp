"""Tasks CRUD API router with calendar support."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta

from database import get_db
from models import Task, Goal, TaskStatus, TaskPriority, EisenhowerQuadrant
from schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def _task_to_response(task: Task) -> TaskResponse:
    """Convert Task model to TaskResponse."""
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        goal_id=task.goal_id,
        priority=task.priority,
        quadrant=task.quadrant,
        status=task.status,
        due_date=task.due_date,
        due_time=task.due_time,
        estimated_minutes=task.estimated_minutes,
        actual_minutes=task.actual_minutes,
        category=task.category,
        is_recurring=task.is_recurring,
        recurrence_pattern=task.recurrence_pattern,
        created_at=task.created_at,
        completed_at=task.completed_at,
        goal_title=task.goal.title if task.goal else None,
    )


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    due_date: Optional[date] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    goal_id: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List tasks with optional filters."""
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if due_date:
        query = query.filter(Task.due_date == due_date)
    if date_from:
        query = query.filter(Task.due_date >= date_from)
    if date_to:
        query = query.filter(Task.due_date <= date_to)
    if goal_id:
        query = query.filter(Task.goal_id == goal_id)
    if category:
        query = query.filter(Task.category == category)
    
    tasks = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()
    return [_task_to_response(t) for t in tasks]


@router.get("/today", response_model=List[TaskResponse])
def get_today_tasks(db: Session = Depends(get_db)):
    """Get all tasks for today."""
    today = date.today()
    tasks = db.query(Task).filter(Task.due_date == today).order_by(Task.priority).all()
    return [_task_to_response(t) for t in tasks]


@router.get("/overdue", response_model=List[TaskResponse])
def get_overdue_tasks(db: Session = Depends(get_db)):
    """Get all overdue incomplete tasks."""
    today = date.today()
    tasks = (
        db.query(Task)
        .filter(Task.due_date < today, Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS]))
        .order_by(Task.due_date.asc())
        .all()
    )
    return [_task_to_response(t) for t in tasks]


@router.get("/calendar/{year}/{month}", response_model=dict)
def get_calendar_tasks(year: int, month: int, db: Session = Depends(get_db)):
    """Get tasks organized by date for a specific month (calendar view)."""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    tasks = (
        db.query(Task)
        .filter(Task.due_date >= start_date, Task.due_date < end_date)
        .order_by(Task.due_date, Task.priority)
        .all()
    )
    
    # Group by date
    calendar_data = {}
    for task in tasks:
        day_key = task.due_date.isoformat()
        if day_key not in calendar_data:
            calendar_data[day_key] = []
        calendar_data[day_key].append(_task_to_response(task).model_dump(mode="json"))
    
    return {"year": year, "month": month, "tasks": calendar_data}


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_response(task)


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    if task_data.goal_id:
        goal = db.query(Goal).filter(Goal.id == task_data.goal_id).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
    
    task = Task(**task_data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_data.model_dump(exclude_unset=True)
    
    # If marking as done, record completion time
    if "status" in update_data and update_data["status"] == TaskStatus.DONE:
        task.completed_at = datetime.utcnow()
    elif "status" in update_data and update_data["status"] != TaskStatus.DONE:
        task.completed_at = None
    
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


@router.post("/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: int, actual_minutes: Optional[int] = None, db: Session = Depends(get_db)):
    """Mark a task as completed."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = TaskStatus.DONE
    task.completed_at = datetime.utcnow()
    if actual_minutes is not None:
        task.actual_minutes = actual_minutes
    
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
