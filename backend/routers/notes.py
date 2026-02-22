"""Notes CRUD API router — all notes stored as markdown."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Note
from schemas import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.get("/", response_model=List[NoteResponse])
def list_notes(
    tag: Optional[str] = None,
    linked_goal_id: Optional[int] = None,
    linked_task_id: Optional[int] = None,
    pinned_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List notes with optional filters and search."""
    query = db.query(Note)
    if tag:
        query = query.filter(Note.tags.contains(tag))
    if linked_goal_id:
        query = query.filter(Note.linked_goal_id == linked_goal_id)
    if linked_task_id:
        query = query.filter(Note.linked_task_id == linked_task_id)
    if pinned_only:
        query = query.filter(Note.is_pinned == True)
    if search:
        query = query.filter(
            (Note.title.ilike(f"%{search}%")) | (Note.content.ilike(f"%{search}%"))
        )
    
    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    return [NoteResponse.model_validate(n) for n in notes]


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a single note (markdown content)."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse.model_validate(note)


@router.post("/", response_model=NoteResponse, status_code=201)
def create_note(note_data: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note (markdown content)."""
    note = Note(**note_data.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteResponse.model_validate(note)


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    """Update a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
    
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return NoteResponse.model_validate(note)


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
