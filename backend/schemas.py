"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum


# --- Enums ---

class GoalCategory(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class GoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    SKIPPED = "skipped"


class TaskPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    OPTIONAL = "optional"


class EisenhowerQuadrant(str, Enum):
    DO_FIRST = "do_first"
    SCHEDULE = "schedule"
    DELEGATE = "delegate"
    ELIMINATE = "eliminate"


# --- Goal Schemas ---

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: GoalCategory
    status: GoalStatus = GoalStatus.NOT_STARTED
    progress: float = Field(0.0, ge=0, le=100)
    target_date: Optional[date] = None
    color: str = "#6366f1"


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[GoalCategory] = None
    status: Optional[GoalStatus] = None
    progress: Optional[float] = Field(None, ge=0, le=100)
    target_date: Optional[date] = None
    color: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    description: str
    category: GoalCategory
    status: GoalStatus
    progress: float
    target_date: Optional[date]
    color: str
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_task_count: int = 0

    class Config:
        from_attributes = True


# --- Task Schemas ---

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    goal_id: Optional[int] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    quadrant: Optional[EisenhowerQuadrant] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    estimated_minutes: Optional[int] = None
    category: str = "general"
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    goal_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    quadrant: Optional[EisenhowerQuadrant] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    category: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    goal_id: Optional[int]
    priority: TaskPriority
    quadrant: Optional[EisenhowerQuadrant]
    status: TaskStatus
    due_date: Optional[date]
    due_time: Optional[time]
    estimated_minutes: Optional[int]
    actual_minutes: Optional[int]
    category: str
    is_recurring: bool
    recurrence_pattern: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    goal_title: Optional[str] = None

    class Config:
        from_attributes = True


# --- Note Schemas ---

class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = ""  # Markdown content
    tags: str = ""
    linked_goal_id: Optional[int] = None
    linked_task_id: Optional[int] = None
    is_pinned: bool = False


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    tags: Optional[str] = None
    linked_goal_id: Optional[int] = None
    linked_task_id: Optional[int] = None
    is_pinned: Optional[bool] = None


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    tags: str
    linked_goal_id: Optional[int]
    linked_task_id: Optional[int]
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- DailyLog Schemas ---

class DailyLogCreate(BaseModel):
    date: date
    productivity_score: Optional[float] = Field(None, ge=0, le=10)
    mood: Optional[str] = None
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    tasks_completed: int = 0
    tasks_total: int = 0
    focus_hours: float = 0.0
    notes: str = ""


class DailyLogUpdate(BaseModel):
    productivity_score: Optional[float] = Field(None, ge=0, le=10)
    mood: Optional[str] = None
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    tasks_completed: Optional[int] = None
    tasks_total: Optional[int] = None
    focus_hours: Optional[float] = None
    notes: Optional[str] = None


class DailyLogResponse(BaseModel):
    id: int
    date: date
    productivity_score: Optional[float]
    mood: Optional[str]
    energy_level: Optional[int]
    tasks_completed: int
    tasks_total: int
    focus_hours: float
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- WeeklyReport Schemas ---

class WeeklyReportResponse(BaseModel):
    id: int
    week_start: date
    week_end: date
    report_content: str
    goals_progress: str
    tasks_summary: str
    insights: str
    productivity_avg: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# --- AI Schemas ---

class AIRequest(BaseModel):
    prompt: Optional[str] = ""
    context: Optional[str] = ""


class AIResponse(BaseModel):
    response: str
    agent: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Analytics Schemas ---

class DashboardStats(BaseModel):
    total_goals: int
    active_goals: int
    completed_goals: int
    total_tasks: int
    tasks_today: int
    tasks_completed_today: int
    tasks_overdue: int
    current_streak: int
    productivity_score: Optional[float]
    weekly_completion_rate: float
    goals_by_category: dict
    recent_tasks: List[TaskResponse]
    content_posts_count: int = 0


# --- TaskCategory Schemas ---

class TaskCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon: str = "📂"
    color: str = "#6366f1"
    description: str = ""


class TaskCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class CategoryItemCreate(BaseModel):
    category_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    status: str = "active"
    phase: Optional[str] = None
    eta: Optional[date] = None
    progress: float = Field(0.0, ge=0, le=100)
    parent_id: Optional[int] = None
    order_index: int = 0


class CategoryItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    phase: Optional[str] = None
    eta: Optional[date] = None
    progress: Optional[float] = Field(None, ge=0, le=100)
    parent_id: Optional[int] = None
    order_index: Optional[int] = None


class CategoryItemResponse(BaseModel):
    id: int
    category_id: int
    title: str
    description: str
    status: str
    phase: Optional[str]
    eta: Optional[date]
    progress: float
    parent_id: Optional[int]
    order_index: int
    created_at: datetime
    updated_at: datetime
    children: Optional[List["CategoryItemResponse"]] = []

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        """Override to handle None children from SQLAlchemy."""
        if hasattr(obj, 'children') and obj.children is None:
            obj.children = []
        return super().model_validate(obj, **kwargs)


class TaskCategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    description: str
    created_at: datetime
    items: List[CategoryItemResponse] = []

    class Config:
        from_attributes = True


# --- ContentPost Schemas ---

class ContentPostCreate(BaseModel):
    platform: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    content_type: str = "post"
    topic: str = ""
    status: str = "idea"
    published_date: Optional[date] = None
    url: Optional[str] = None
    engagement: str = ""
    notes: str = ""


class ContentPostUpdate(BaseModel):
    platform: Optional[str] = None
    title: Optional[str] = None
    content_type: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = None
    published_date: Optional[date] = None
    url: Optional[str] = None
    engagement: Optional[str] = None
    notes: Optional[str] = None


class ContentPostResponse(BaseModel):
    id: int
    platform: str
    title: str
    content_type: str
    topic: str
    status: str
    published_date: Optional[date]
    url: Optional[str]
    engagement: str
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True

