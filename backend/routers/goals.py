"""Goals CRUD API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Goal, Task, GoalCategory, GoalStatus, TaskStatus
from schemas import GoalCreate, GoalUpdate, GoalResponse

router = APIRouter(prefix="/api/goals", tags=["Goals"])


def _goal_to_response(goal: Goal) -> GoalResponse:
    """Convert Goal model to GoalResponse with computed fields."""
    task_count = len(goal.tasks) if goal.tasks else 0
    completed_count = sum(1 for t in goal.tasks if t.status == TaskStatus.DONE) if goal.tasks else 0
    return GoalResponse(
        id=goal.id,
        title=goal.title,
        description=goal.description,
        category=goal.category,
        status=goal.status,
        progress=goal.progress,
        target_date=goal.target_date,
        color=goal.color,
        created_at=goal.created_at,
        updated_at=goal,
        task_count=task_count,
        completed_task_count=completed_count,
    )


@router.get("/", response_model=List[GoalResponse])
def list_goals(
    category: Optional[GoalCategory] = None,
    status: Optional[GoalStatus] = None,
    db: Session = Depends(get_db),
):
    """List all goals with optional filters."""
    query = db.query(Goal)
    if category:
        query = query.filter(Goal.category == category)
    if status:
        query = query.filter(Goal.status == status)
    goals = query.order_by(Goal.created_at.desc()).all()
    return [_goal_to_response(g) for g in goals]


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    """Get a single goal by ID."""
    goal = db.query(Goal).filter(Goal.id == goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _goal_to_response(goal)


@router.post("/", response_model=GoalResponse, status_code=201)
def create_goal(goal_data: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal."""
    goal = Goal(**goal_data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _goal_to_response(goal)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: int, goal_data: GoalUpdate, db: Session = Depends(get_db)):
    """Update an existing goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = goal_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
    
    goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return _goal_to_response(goal)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    """Delete a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
