"""Task Categories & Content Posts CRUD router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import TaskCategory, CategoryItem, ContentPost
from schemas import (
    TaskCategoryCreate, TaskCategoryUpdate, TaskCategoryResponse,
    CategoryItemCreate, CategoryItemUpdate, CategoryItemResponse,
    ContentPostCreate, ContentPostUpdate, ContentPostResponse,
)

router = APIRouter(prefix="/api/categories", tags=["Categories & Content"])


# --- Task Categories ---

@router.get("/", response_model=List[TaskCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """List all task categories with their items."""
    categories = db.query(TaskCategory).order_by(TaskCategory.created_at).all()
    return [TaskCategoryResponse.model_validate(c) for c in categories]


@router.get("/{cat_id}", response_model=TaskCategoryResponse)
def get_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(TaskCategory).filter(TaskCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return TaskCategoryResponse.model_validate(cat)


@router.post("/", response_model=TaskCategoryResponse, status_code=201)
def create_category(data: TaskCategoryCreate, db: Session = Depends(get_db)):
    cat = TaskCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return TaskCategoryResponse.model_validate(cat)


@router.put("/{cat_id}", response_model=TaskCategoryResponse)
def update_category(cat_id: int, data: TaskCategoryUpdate, db: Session = Depends(get_db)):
    cat = db.query(TaskCategory).filter(TaskCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return TaskCategoryResponse.model_validate(cat)


@router.delete("/{cat_id}", status_code=204)
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(TaskCategory).filter(TaskCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()


# --- Category Items (Sub-items) ---

@router.get("/{cat_id}/items", response_model=List[CategoryItemResponse])
def list_category_items(cat_id: int, db: Session = Depends(get_db)):
    """List top-level items in a category (children are nested)."""
    items = db.query(CategoryItem).filter(
        CategoryItem.category_id == cat_id,
        CategoryItem.parent_id == None
    ).order_by(CategoryItem.order_index, CategoryItem.created_at).all()
    return [CategoryItemResponse.model_validate(i) for i in items]


@router.post("/items", response_model=CategoryItemResponse, status_code=201)
def create_category_item(data: CategoryItemCreate, db: Session = Depends(get_db)):
    cat = db.query(TaskCategory).filter(TaskCategory.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    item = CategoryItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return CategoryItemResponse.model_validate(item)


@router.put("/items/{item_id}", response_model=CategoryItemResponse)
def update_category_item(item_id: int, data: CategoryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(CategoryItem).filter(CategoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return CategoryItemResponse.model_validate(item)


@router.delete("/items/{item_id}", status_code=204)
def delete_category_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CategoryItem).filter(CategoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


# --- Content Posts ---

@router.get("/content/posts", response_model=List[ContentPostResponse])
def list_content_posts(
    platform: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List content posts with optional filters."""
    query = db.query(ContentPost)
    if platform:
        query = query.filter(ContentPost.platform == platform)
    if status:
        query = query.filter(ContentPost.status == status)
    posts = query.order_by(ContentPost.created_at.desc()).all()
    return [ContentPostResponse.model_validate(p) for p in posts]


@router.post("/content/posts", response_model=ContentPostResponse, status_code=201)
def create_content_post(data: ContentPostCreate, db: Session = Depends(get_db)):
    post = ContentPost(**data.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return ContentPostResponse.model_validate(post)


@router.put("/content/posts/{post_id}", response_model=ContentPostResponse)
def update_content_post(post_id: int, data: ContentPostUpdate, db: Session = Depends(get_db)):
    post = db.query(ContentPost).filter(ContentPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(post, k, v)
    db.commit()
    db.refresh(post)
    return ContentPostResponse.model_validate(post)


@router.delete("/content/posts/{post_id}", status_code=204)
def delete_content_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(ContentPost).filter(ContentPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Content post not found")
    db.delete(post)
    db.commit()
