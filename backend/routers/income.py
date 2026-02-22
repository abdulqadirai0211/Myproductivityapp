"""Income Tracker API router."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, datetime

from database import get_db
from models import IncomeEntry, IncomeGoal
from schemas import (
    IncomeEntryCreate, IncomeEntryUpdate, IncomeEntryResponse,
    IncomeGoalCreate, IncomeGoalResponse, IncomeSummary,
)

logger = logging.getLogger("mytracker.income")
router = APIRouter(prefix="/api/income", tags=["Income"])


# --- Income Entries ---

@router.get("/entries", response_model=List[IncomeEntryResponse])
def list_entries(
    category: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(IncomeEntry)
    if category:
        query = query.filter(IncomeEntry.category == category)
    if year:
        query = query.filter(extract("year", IncomeEntry.date) == year)
    if month:
        query = query.filter(extract("month", IncomeEntry.date) == month)
    entries = query.order_by(IncomeEntry.date.desc()).all()
    return [IncomeEntryResponse.model_validate(e) for e in entries]


@router.post("/entries", response_model=IncomeEntryResponse, status_code=201)
def create_entry(data: IncomeEntryCreate, db: Session = Depends(get_db)):
    logger.info(f"💰 New income: ₹{data.amount} from {data.source}")
    entry = IncomeEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return IncomeEntryResponse.model_validate(entry)


@router.put("/entries/{entry_id}", response_model=IncomeEntryResponse)
def update_entry(entry_id: int, data: IncomeEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(IncomeEntry).filter(IncomeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return IncomeEntryResponse.model_validate(entry)


@router.delete("/entries/{entry_id}", status_code=204)
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(IncomeEntry).filter(IncomeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()


# --- Income Goals ---

@router.get("/goals", response_model=List[IncomeGoalResponse])
def list_goals(db: Session = Depends(get_db)):
    goals = db.query(IncomeGoal).order_by(IncomeGoal.created_at.desc()).all()
    result = []
    for g in goals:
        current = db.query(func.sum(IncomeEntry.amount)).filter(
            IncomeEntry.date >= g.start_date,
            IncomeEntry.date <= g.end_date,
        ).scalar() or 0.0
        progress = (current / g.target_amount * 100) if g.target_amount > 0 else 0.0
        result.append(IncomeGoalResponse(
            id=g.id, title=g.title, target_amount=g.target_amount,
            currency=g.currency, period=g.period,
            start_date=g.start_date, end_date=g.end_date,
            current_amount=current, progress=round(progress, 1),
            created_at=g.created_at,
        ))
    return result


@router.post("/goals", response_model=IncomeGoalResponse, status_code=201)
def create_goal(data: IncomeGoalCreate, db: Session = Depends(get_db)):
    logger.info(f"🎯 Income goal: ₹{data.target_amount} ({data.period})")
    goal = IncomeGoal(**data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return IncomeGoalResponse(
        id=goal.id, title=goal.title, target_amount=goal.target_amount,
        currency=goal.currency, period=goal.period,
        start_date=goal.start_date, end_date=goal.end_date,
        current_amount=0.0, progress=0.0, created_at=goal.created_at,
    )


@router.delete("/goals/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(IncomeGoal).filter(IncomeGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()


# --- Summary ---

@router.get("/summary", response_model=IncomeSummary)
def get_summary(db: Session = Depends(get_db)):
    today = date.today()

    # This month
    month_total = db.query(func.sum(IncomeEntry.amount)).filter(
        extract("year", IncomeEntry.date) == today.year,
        extract("month", IncomeEntry.date) == today.month,
    ).scalar() or 0.0

    # This year
    year_total = db.query(func.sum(IncomeEntry.amount)).filter(
        extract("year", IncomeEntry.date) == today.year,
    ).scalar() or 0.0

    # By category
    cat_rows = db.query(IncomeEntry.category, func.sum(IncomeEntry.amount)).filter(
        extract("year", IncomeEntry.date) == today.year,
    ).group_by(IncomeEntry.category).all()
    by_category = {r[0]: float(r[1]) for r in cat_rows}

    # By source
    source_rows = db.query(IncomeEntry.source, func.sum(IncomeEntry.amount)).filter(
        extract("year", IncomeEntry.date) == today.year,
    ).group_by(IncomeEntry.source).all()
    by_source = {r[0]: float(r[1]) for r in source_rows}

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        total = db.query(func.sum(IncomeEntry.amount)).filter(
            extract("year", IncomeEntry.date) == y,
            extract("month", IncomeEntry.date) == m,
        ).scalar() or 0.0
        monthly_trend.append({"month": f"{y}-{m:02d}", "amount": float(total)})

    return IncomeSummary(
        total_this_month=float(month_total),
        total_this_year=float(year_total),
        by_category=by_category,
        by_source=by_source,
        monthly_trend=monthly_trend,
    )
