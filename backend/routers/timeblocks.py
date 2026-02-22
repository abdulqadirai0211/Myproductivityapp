"""Time Blocking API router."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database import get_db
from models import TimeBlock
from schemas import TimeBlockCreate, TimeBlockUpdate, TimeBlockResponse

logger = logging.getLogger("mytracker.timeblocks")
router = APIRouter(prefix="/api/time-blocks", tags=["Time Blocks"])


@router.get("/", response_model=List[TimeBlockResponse])
def list_blocks(
    block_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(TimeBlock)
    if block_date:
        query = query.filter(TimeBlock.date == block_date)
    else:
        query = query.filter(TimeBlock.date == date.today())
    blocks = query.order_by(TimeBlock.start_time).all()
    return [TimeBlockResponse.model_validate(b) for b in blocks]


@router.post("/", response_model=TimeBlockResponse, status_code=201)
def create_block(data: TimeBlockCreate, db: Session = Depends(get_db)):
    logger.info(f"🕐 Time block: {data.title} ({data.start_time}-{data.end_time})")
    block = TimeBlock(**data.model_dump())
    db.add(block)
    db.commit()
    db.refresh(block)
    return TimeBlockResponse.model_validate(block)


@router.put("/{block_id}", response_model=TimeBlockResponse)
def update_block(block_id: int, data: TimeBlockUpdate, db: Session = Depends(get_db)):
    block = db.query(TimeBlock).filter(TimeBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(block, k, v)
    db.commit()
    db.refresh(block)
    return TimeBlockResponse.model_validate(block)


@router.delete("/{block_id}", status_code=204)
def delete_block(block_id: int, db: Session = Depends(get_db)):
    block = db.query(TimeBlock).filter(TimeBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(block)
    db.commit()


@router.post("/{block_id}/complete", response_model=TimeBlockResponse)
def complete_block(block_id: int, db: Session = Depends(get_db)):
    block = db.query(TimeBlock).filter(TimeBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    block.is_completed = not block.is_completed
    db.commit()
    db.refresh(block)
    logger.info(f"  {'✅' if block.is_completed else '⬜'} Block '{block.title}' toggled")
    return TimeBlockResponse.model_validate(block)
