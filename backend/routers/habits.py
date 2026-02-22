"""Habits & Streaks API router."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from database import get_db
from models import Habit, HabitLog
from schemas import (
    HabitCreate, HabitUpdate, HabitResponse,
    HabitLogCreate, HabitLogResponse, HabitHeatmapDay,
)

logger = logging.getLogger("mytracker.habits")
router = APIRouter(prefix="/api/habits", tags=["Habits"])


@router.get("/", response_model=List[HabitResponse])
def list_habits(db: Session = Depends(get_db)):
    habits = db.query(Habit).filter(Habit.is_active == True).order_by(Habit.created_at).all()
    today = date.today()
    result = []
    for h in habits:
        today_log = db.query(HabitLog).filter(HabitLog.habit_id == h.id, HabitLog.date == today).first()
        total = db.query(HabitLog).filter(HabitLog.habit_id == h.id, HabitLog.completed == True).count()
        resp = HabitResponse(
            id=h.id, name=h.name, description=h.description, icon=h.icon,
            color=h.color, frequency=h.frequency, target_value=h.target_value,
            unit=h.unit, is_active=h.is_active, current_streak=h.current_streak,
            best_streak=h.best_streak, created_at=h.created_at,
            today_completed=today_log.completed if today_log else False,
            total_completions=total,
        )
        result.append(resp)
    return result


@router.post("/", response_model=HabitResponse, status_code=201)
def create_habit(data: HabitCreate, db: Session = Depends(get_db)):
    logger.info(f"📌 Creating habit: {data.name}")
    habit = Habit(**data.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return HabitResponse(
        id=habit.id, name=habit.name, description=habit.description, icon=habit.icon,
        color=habit.color, frequency=habit.frequency, target_value=habit.target_value,
        unit=habit.unit, is_active=habit.is_active, current_streak=0, best_streak=0,
        created_at=habit.created_at, today_completed=False, total_completions=0,
    )


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, data: HabitUpdate, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(habit, k, v)
    db.commit()
    db.refresh(habit)
    today_log = db.query(HabitLog).filter(HabitLog.habit_id == habit.id, HabitLog.date == date.today()).first()
    total = db.query(HabitLog).filter(HabitLog.habit_id == habit.id, HabitLog.completed == True).count()
    return HabitResponse(
        id=habit.id, name=habit.name, description=habit.description, icon=habit.icon,
        color=habit.color, frequency=habit.frequency, target_value=habit.target_value,
        unit=habit.unit, is_active=habit.is_active, current_streak=habit.current_streak,
        best_streak=habit.best_streak, created_at=habit.created_at,
        today_completed=today_log.completed if today_log else False,
        total_completions=total,
    )


@router.delete("/{habit_id}", status_code=204)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()


@router.post("/check-in", response_model=HabitLogResponse)
def check_in(data: HabitLogCreate, db: Session = Depends(get_db)):
    """Toggle a habit completion for a specific date. Updates streaks."""
    logger.info(f"✅ Check-in: habit={data.habit_id}, date={data.date}, completed={data.completed}")
    habit = db.query(Habit).filter(Habit.id == data.habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Upsert log
    existing = db.query(HabitLog).filter(
        HabitLog.habit_id == data.habit_id, HabitLog.date == data.date
    ).first()

    if existing:
        existing.completed = data.completed
        existing.value = data.value
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        log = existing
    else:
        log = HabitLog(**data.model_dump())
        db.add(log)
        db.commit()
        db.refresh(log)

    # Recalculate streak
    _recalculate_streak(db, habit)

    return HabitLogResponse.model_validate(log)


def _recalculate_streak(db: Session, habit: Habit):
    """Recalculate current and best streak for a habit."""
    today = date.today()
    streak = 0
    check_date = today

    while True:
        log = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date == check_date,
            HabitLog.completed == True,
        ).first()
        if log:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    habit.current_streak = streak
    if streak > habit.best_streak:
        habit.best_streak = streak
    db.commit()
    logger.info(f"  🔥 Streak updated: current={streak}, best={habit.best_streak}")


@router.get("/{habit_id}/heatmap", response_model=List[HabitHeatmapDay])
def get_heatmap(habit_id: int, days: int = 90, db: Session = Depends(get_db)):
    """Get heatmap data for a habit (last N days)."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today = date.today()
    start = today - timedelta(days=days)
    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.date >= start,
    ).all()

    log_map = {l.date: l for l in logs}
    result = []
    for i in range(days + 1):
        d = start + timedelta(days=i)
        log = log_map.get(d)
        result.append(HabitHeatmapDay(
            date=d,
            completed=log.completed if log else False,
            value=log.value if log else 0.0,
        ))
    return result


@router.get("/today", response_model=List[HabitResponse])
def get_today_habits(db: Session = Depends(get_db)):
    """Get all habits with today's completion status."""
    return list_habits(db)
