"""Daily Standup / Reflection API router."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from database import get_db
from models import Standup
from schemas import StandupCreate, StandupUpdate, StandupResponse

logger = logging.getLogger("mytracker.standups")
router = APIRouter(prefix="/api/standups", tags=["Standups"])


@router.get("/", response_model=List[StandupResponse])
def list_standups(limit: int = 14, db: Session = Depends(get_db)):
    standups = db.query(Standup).order_by(Standup.date.desc()).limit(limit).all()
    return [StandupResponse.model_validate(s) for s in standups]


@router.get("/today", response_model=StandupResponse)
def get_today(db: Session = Depends(get_db)):
    today = date.today()
    standup = db.query(Standup).filter(Standup.date == today).first()
    if not standup:
        # Auto-create today's standup
        standup = Standup(date=today)
        db.add(standup)
        db.commit()
        db.refresh(standup)
    return StandupResponse.model_validate(standup)


@router.get("/{standup_date}", response_model=StandupResponse)
def get_standup(standup_date: date, db: Session = Depends(get_db)):
    standup = db.query(Standup).filter(Standup.date == standup_date).first()
    if not standup:
        raise HTTPException(status_code=404, detail="Standup not found")
    return StandupResponse.model_validate(standup)


@router.post("/", response_model=StandupResponse, status_code=201)
def create_standup(data: StandupCreate, db: Session = Depends(get_db)):
    logger.info(f"📝 Creating standup for {data.date}")
    existing = db.query(Standup).filter(Standup.date == data.date).first()
    if existing:
        for k, v in data.model_dump().items():
            if v:
                setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return StandupResponse.model_validate(existing)

    standup = Standup(**data.model_dump())
    db.add(standup)
    db.commit()
    db.refresh(standup)
    return StandupResponse.model_validate(standup)


@router.put("/{standup_date}", response_model=StandupResponse)
def update_standup(standup_date: date, data: StandupUpdate, db: Session = Depends(get_db)):
    logger.info(f"✏️ Updating standup for {standup_date}")
    standup = db.query(Standup).filter(Standup.date == standup_date).first()
    if not standup:
        standup = Standup(date=standup_date)
        db.add(standup)
        db.commit()
        db.refresh(standup)

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(standup, k, v)
    db.commit()
    db.refresh(standup)
    return StandupResponse.model_validate(standup)


@router.get("/weekly-summary", response_model=List[StandupResponse])
def weekly_summary(db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    standups = db.query(Standup).filter(
        Standup.date >= week_start, Standup.date <= today
    ).order_by(Standup.date).all()
    return [StandupResponse.model_validate(s) for s in standups]
